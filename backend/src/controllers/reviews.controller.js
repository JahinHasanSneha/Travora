const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/reviews?hotel_id=&restaurant_id=&cruise_id=&package_id=&trip_id=
const listReviews = asyncHandler(async (req, res) => {
  const { hotel_id, restaurant_id, cruise_id, package_id, trip_id } = req.query;

  // Trip reviews are only readable for public trips, or by members of the trip
  // (so reviews of a private trip can't be read by guessing its id).
  if (trip_id) {
    const trip = await db.query('SELECT is_public FROM custom_trips WHERE trip_id = $1', [trip_id]);
    if (!trip.rows[0]) return res.json([]);
    if (!trip.rows[0].is_public) {
      const member = req.user
        ? await db.query('SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2', [trip_id, req.user.user_id])
        : { rows: [] };
      if (!member.rows[0]) return res.status(403).json({ error: 'Reviews for this trip are private.' });
    }
  }

  const params = [];
  let sql = `SELECT rv.*, u.full_name AS reviewer_name FROM reviews rv JOIN users u ON u.user_id = rv.user_id WHERE 1=1`;
  if (hotel_id) { params.push(hotel_id); sql += ` AND rv.hotel_id = $${params.length}`; }
  if (restaurant_id) { params.push(restaurant_id); sql += ` AND rv.restaurant_id = $${params.length}`; }
  if (cruise_id) { params.push(cruise_id); sql += ` AND rv.cruise_id = $${params.length}`; }
  if (package_id) { params.push(package_id); sql += ` AND rv.package_id = $${params.length}`; }
  if (trip_id) { params.push(trip_id); sql += ` AND rv.trip_id = $${params.length}`; }
  sql += ' ORDER BY rv.created_at DESC LIMIT 100';
  const result = await db.query(sql, params);
  res.json(result.rows);
});

// POST /api/reviews - a signed-in traveler reviews a hotel, restaurant, cruise, package or trip.
// Hotels, restaurants, cruises and packages are open to any signed-in traveler.
// Trips can only be reviewed by travelers who joined the trip (not its organizer), once each.
const createReview = asyncHandler(async (req, res) => {
  const { hotel_id, restaurant_id, cruise_id, package_id, trip_id, rating, comment } = req.body;
  const refCount = [hotel_id, restaurant_id, cruise_id, package_id, trip_id].filter((v) => v !== undefined && v !== null).length;
  if (refCount !== 1) {
    return res.status(400).json({ error: 'Exactly one of hotel_id, restaurant_id, cruise_id, package_id, trip_id is required.' });
  }
  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5.' });
  }

  if (trip_id) {
    const trip = await db.query('SELECT 1 FROM custom_trips WHERE trip_id = $1', [trip_id]);
    if (!trip.rows[0]) return res.status(404).json({ error: 'Trip not found.' });

    const member = await db.query(
      'SELECT role, confirmed FROM trip_members WHERE trip_id = $1 AND user_id = $2',
      [trip_id, req.user.user_id]
    );
    const m = member.rows[0];
    if (!m || !m.confirmed) {
      return res.status(403).json({ error: 'Only travelers who joined this trip can review it.' });
    }
    if (m.role === 'organizer') {
      return res.status(403).json({ error: "You can't review a trip you organized." });
    }
    const existing = await db.query('SELECT 1 FROM reviews WHERE trip_id = $1 AND user_id = $2', [trip_id, req.user.user_id]);
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'You have already reviewed this trip.' });
    }
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO reviews (user_id, hotel_id, restaurant_id, cruise_id, package_id, trip_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.user_id, hotel_id || null, restaurant_id || null, cruise_id || null, package_id || null, trip_id || null, numericRating, comment || null]
    );
    // trg_reviews_rating fires here (AFTER INSERT) and refreshes the listing's rating
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = { listReviews, createReview };
