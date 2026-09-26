const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { syncPackageSlots } = require('../utils/capacity');

// Confirmed/completed bookings are the ONLY ones that occupy slots.
// slots_available is always computed from them so the public pages never drift.
const LIVE_SLOTS = `
  p.*,
  COALESCE(cf.n, 0)::int AS confirmed_travelers,
  GREATEST(COALESCE(p.max_group_size, p.slots_available + COALESCE(cf.n, 0)) - COALESCE(cf.n, 0), 0)::int AS slots_available
`;
const CONFIRMED_JOIN = `
  LEFT JOIN LATERAL (
    SELECT SUM(GREATEST(b.number_of_travelers, 1)) AS n
    FROM bookings b
    WHERE b.package_id = p.package_id AND b.booking_status IN ('confirmed', 'completed')
  ) cf ON true
`;

const validImage = (v) =>
  v == null || v === '' ||
  (typeof v === 'string' && v.length <= 2000 && /^https?:\/\/\S+$/i.test(v));

// GET /api/packages - public marketplace listing (approved + active only)
const getAllPackages = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT ${LIVE_SLOTS}, tc.company_name,
              COALESCE(rc.review_count, 0)::int AS review_count
       FROM packages p
       ${CONFIRMED_JOIN}
       LEFT JOIN travel_companies tc ON tc.company_id = p.company_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS review_count
         FROM reviews WHERE reviews.package_id = p.package_id
       ) rc ON true
       WHERE p.is_approved = TRUE AND p.status IN ('active', 'fully_booked')
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// GET /api/packages/:id
const getPackageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT ${LIVE_SLOTS}, tc.company_name,
              COALESCE(rc.review_count, 0)::int AS review_count
       FROM packages p
       ${CONFIRMED_JOIN}
       LEFT JOIN travel_companies tc ON tc.company_id = p.company_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS review_count
         FROM reviews WHERE reviews.package_id = p.package_id
       ) rc ON true
       WHERE p.package_id = $1`,
      [id]
    );
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// GET /api/packages/mine/list - the logged-in travel company's own packages, any status
// enrolled_count = travelers on CONFIRMED bookings only (these are the ones occupying slots).
// pending_count  = travelers who booked but are not confirmed yet (they do NOT occupy slots).
const myPackages = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT
       p.*,
       COALESCE(SUM(CASE WHEN b.booking_status IN ('confirmed', 'completed')
                         THEN GREATEST(b.number_of_travelers, 1) ELSE 0 END), 0)::int AS enrolled_count,
       COALESCE(SUM(CASE WHEN b.booking_status = 'pending'
                         THEN GREATEST(b.number_of_travelers, 1) ELSE 0 END), 0)::int AS pending_count
     FROM packages p
     JOIN travel_companies tc ON tc.company_id = p.company_id
     LEFT JOIN bookings b ON b.package_id = p.package_id
     WHERE tc.user_id = $1
     GROUP BY p.package_id
     ORDER BY p.created_at DESC`,
    [req.user.user_id]
  );
  const packages = result.rows.map((pkg) => {
    const enrolled = Number(pkg.enrolled_count || 0);
    const capacity = Number(pkg.max_group_size ?? (Number(pkg.slots_available || 0) + enrolled));
    return {
      ...pkg,
      enrolled_count: enrolled,
      pending_count: Number(pkg.pending_count || 0),
      max_group_size: capacity,
      slots_available: Math.max(capacity - enrolled, 0),
    };
  });
  res.json(packages);
});

// POST /api/packages - travel company creates a new package
const createPackage = asyncHandler(async (req, res) => {
  const companyResult = await db.query(
    'SELECT company_id, is_approved FROM travel_companies WHERE user_id = $1',
    [req.user.user_id]
  );
  const company = companyResult.rows[0];
  if (!company) {
    return res.status(403).json({ error: 'Only registered travel companies can create packages.' });
  }
  if (!company.is_approved) {
    return res.status(403).json({ error: 'Your company account is still pending admin approval.' });
  }

  const {
    title, description, destination_city, destination_country, duration_days,
    base_price, max_group_size, start_date, end_date, inclusions, exclusions, image_url,
  } = req.body;

  if (!title || !destination_city || !destination_country || !duration_days || !base_price) {
    return res.status(400).json({
      error: 'title, destination_city, destination_country, duration_days, and base_price are required.',
    });
  }

  if (!validImage(image_url)) {
    return res.status(400).json({ error: 'image_url must be a valid http(s) image link.' });
  }

  const slots = parseInt(max_group_size, 10) || 10;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO packages (
         company_id, title, description, destination_city, destination_country, duration_days,
         base_price, max_group_size, start_date, end_date, inclusions, exclusions, image_url,
         slots_available, status, is_approved
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'active',TRUE)
       RETURNING *`,
      [
        company.company_id,
        title,
        description || null,
        destination_city,
        destination_country,
        parseInt(duration_days, 10),
        parseFloat(base_price),
        slots,
        start_date || null,
        end_date || null,
        inclusions || null,
        exclusions || null,
        image_url || null,
        slots,
      ]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// PATCH /api/packages/:id - travel company updates its own package (e.g. toggle status)
const updatePackage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ownerCheck = await db.query(
    `SELECT p.package_id FROM packages p
     JOIN travel_companies tc ON tc.company_id = p.company_id
     WHERE p.package_id = $1 AND tc.user_id = $2`,
    [id, req.user.user_id]
  );
  if (!ownerCheck.rows[0]) {
    return res.status(403).json({ error: 'You may only edit your own packages.' });
  }

  const fields = [
    'title', 'description', 'destination_city', 'destination_country', 'duration_days',
    'base_price', 'max_group_size', 'start_date', 'end_date', 'inclusions', 'exclusions',
    'image_url', 'status',
  ];
  if (req.body.image_url !== undefined && !validImage(req.body.image_url)) {
    return res.status(400).json({ error: 'image_url must be a valid http(s) image link.' });
  }
  if (req.body.status !== undefined && !['active', 'inactive'].includes(req.body.status)) {
    return res.status(400).json({ error: 'status must be "active" or "inactive" (fully_booked is set automatically).' });
  }
  const sets = [];
  const params = [];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      params.push(req.body[f]);
      sets.push(`${f} = $${params.length}`);
    }
  });
  if (sets.length === 0) return res.status(400).json({ error: 'No valid fields to update.' });
  params.push(id);

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE packages SET ${sets.join(', ')} WHERE package_id = $${params.length} RETURNING *`,
      params
    );
    // Capacity or status may have changed: re-derive slots + fully_booked from confirmed bookings.
    const synced = await syncPackageSlots(client, id);
    await client.query('COMMIT');
    res.json(synced || result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// GET /api/packages/:id/enrollments - travelers booked into one of the company's own packages
const packageEnrollments = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ownerCheck = await db.query(
    `SELECT p.package_id FROM packages p
     JOIN travel_companies tc ON tc.company_id = p.company_id
     WHERE p.package_id = $1 AND tc.user_id = $2`,
    [id, req.user.user_id]
  );
  if (!ownerCheck.rows[0]) {
    return res.status(403).json({ error: 'You may only view enrollments for your own packages.' });
  }

  const result = await db.query(
    `SELECT
        b.booking_id,
        u.user_id,
        u.full_name AS name,
        u.email,
        u.phone AS mobile,
        b.number_of_travelers AS members,
        b.booking_status AS status,
        b.payment_status,
        (b.booking_status IN ('confirmed', 'completed')) AS occupies_slot,
        b.booked_at AS created_at
     FROM bookings b
     JOIN users u ON u.user_id = b.user_id
     WHERE b.package_id = $1 AND b.booking_status <> 'cancelled'
     ORDER BY (b.booking_status IN ('confirmed', 'completed')) DESC, b.booked_at DESC`,
    [id]
  );

  res.json(result.rows);
});

module.exports = { getAllPackages, getPackageById, myPackages, createPackage, updatePackage, packageEnrollments };
