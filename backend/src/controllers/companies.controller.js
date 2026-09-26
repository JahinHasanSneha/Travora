const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// ============================================================
// GET /api/companies
// Public - approved companies only
// ============================================================

const listCompanies = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT
        company_id,
        company_name,
        company_address,
        website,
        rating,
        is_approved
     FROM travel_companies
     WHERE is_approved = TRUE
     ORDER BY rating DESC NULLS LAST`
  );

  res.json(result.rows);
});


// ============================================================
// GET /api/companies/me
// Own company profile
// ============================================================

const myCompany = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT *
     FROM travel_companies
     WHERE user_id = $1`,
    [req.user.user_id]
  );

  if (!result.rows[0]) {
    return res.status(404).json({
      error: 'Company profile not found.'
    });
  }

  res.json(result.rows[0]);
});


// ============================================================
// PATCH /api/companies/me
// Update own company profile
// ============================================================

const updateMyCompany = asyncHandler(async (req, res) => {
  const {
    company_name,
    business_registration,
    company_address,
    company_phone,
    company_email,
    website
  } = req.body;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE travel_companies
       SET
         company_name = COALESCE($1, company_name),
         business_registration = COALESCE($2, business_registration),
         company_address = COALESCE($3, company_address),
         company_phone = COALESCE($4, company_phone),
         company_email = COALESCE($5, company_email),
         website = COALESCE($6, website)
       WHERE user_id = $7
       RETURNING *`,
      [
        company_name,
        business_registration,
        company_address,
        company_phone,
        company_email,
        website,
        req.user.user_id
      ]
    );

    await client.query('COMMIT');

    if (!result.rows[0]) {
      return res.status(404).json({
        error: 'Company profile not found.'
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});


// ============================================================
// GET /api/companies/me/analytics
// Company enrollment analytics
// ============================================================

const companyAnalytics = asyncHandler(async (req, res) => {

  const result = await db.query(
    `
    SELECT
      COUNT(DISTINCT p.package_id) AS total_packages,

      COUNT(
        DISTINCT CASE
          WHEN p.status = 'active'
          THEN p.package_id
        END
      ) AS active_packages,

      COUNT(
        DISTINCT CASE
          WHEN b.booking_status IN ('confirmed', 'completed')
          THEN b.booking_id
        END
      ) AS total_bookings,

      COALESCE(
        SUM(
          CASE
            WHEN b.booking_status IN ('confirmed', 'completed')
            THEN COALESCE(b.number_of_travelers, 1)
            ELSE 0
          END
        ),
        0
      ) AS total_travelers,

      COALESCE(
        SUM(p.max_group_size),
        0
      ) AS total_capacity

    FROM travel_companies tc

    LEFT JOIN packages p
      ON p.company_id = tc.company_id

    LEFT JOIN bookings b
      ON b.package_id = p.package_id

    WHERE tc.user_id = $1
    `,
    [req.user.user_id]
  );

  const data = result.rows[0] || {
    total_packages: 0,
    active_packages: 0,
    total_bookings: 0,
    total_travelers: 0,
    total_capacity: 0
  };

  const totalTravelers = Number(data.total_travelers || 0);
  const totalCapacity = Number(data.total_capacity || 0);

  const enrollmentPercentage =
    totalCapacity > 0
      ? Math.round(
          (totalTravelers / totalCapacity) * 100
        )
      : 0;

  res.json({
    total_packages: Number(data.total_packages || 0),
    active_packages: Number(data.active_packages || 0),
    total_bookings: Number(data.total_bookings || 0),
    total_travelers: totalTravelers,
    total_capacity: totalCapacity,
    enrollment_percentage: enrollmentPercentage
  });
});


// ============================================================
// GET /api/companies/me/packages/:packageId/enrollments
// View travelers enrolled in one of company's packages
// ============================================================

const packageEnrollments = asyncHandler(async (req, res) => {

  const { packageId } = req.params;

  const result = await db.query(
    `
    SELECT
      b.booking_id,

      u.user_id,
      u.full_name AS name,
      u.email,
      u.phone AS mobile,

      b.number_of_travelers AS members,
      b.booking_status AS status,
      b.booked_at AS created_at

    FROM bookings b

    JOIN users u
      ON u.user_id = b.user_id

    JOIN packages p
      ON p.package_id = b.package_id

    JOIN travel_companies tc
      ON tc.company_id = p.company_id

    WHERE
      p.package_id = $1
      AND tc.user_id = $2

    ORDER BY b.booked_at DESC
    `,
    [
      packageId,
      req.user.user_id
    ]
  );

  res.json(result.rows);
});


// ============================================================
// GET /api/companies/me/package-analytics
// Analytics for each package
// ============================================================

const packageAnalytics = asyncHandler(async (req, res) => {

  const result = await db.query(
    `
    SELECT
      p.package_id,
      p.title,
      p.destination_city,
      p.destination_country,
      p.duration_days,
      p.base_price,
      p.max_group_size,
      p.status,

      COUNT(
        DISTINCT CASE
          WHEN b.booking_status IN ('confirmed', 'completed')
          THEN b.booking_id
        END
      ) AS total_bookings,

      COALESCE(
        SUM(
          CASE
            WHEN b.booking_status IN ('confirmed', 'completed')
            THEN COALESCE(b.number_of_travelers, 1)
            ELSE 0
          END
        ),
        0
      ) AS enrolled_travelers

    FROM packages p

    JOIN travel_companies tc
      ON tc.company_id = p.company_id

    LEFT JOIN bookings b
      ON b.package_id = p.package_id

    WHERE tc.user_id = $1

    GROUP BY
      p.package_id,
      p.title,
      p.destination_city,
      p.destination_country,
      p.duration_days,
      p.base_price,
      p.max_group_size,
      p.status

    ORDER BY enrolled_travelers DESC
    `,
    [req.user.user_id]
  );

  const packages = result.rows.map((pkg) => {

    const enrolled = Number(
      pkg.enrolled_travelers || 0
    );

    const capacity = Number(
      pkg.max_group_size || 0
    );

    const enrollmentPercentage =
      capacity > 0
        ? Math.round(
            (enrolled / capacity) * 100
          )
        : 0;

    return {
      ...pkg,

      total_bookings: Number(
        pkg.total_bookings || 0
      ),

      enrolled_travelers: enrolled,

      max_group_size: capacity,

      slots_available: Math.max(
        capacity - enrolled,
        0
      ),

      enrollment_percentage:
        enrollmentPercentage
    };
  });

  res.json(packages);
});


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  listCompanies,
  myCompany,
  updateMyCompany,
  companyAnalytics,
  packageEnrollments,
  packageAnalytics
};