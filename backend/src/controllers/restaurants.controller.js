const db = require('../config/db');

/* =========================================================
   GET ALL RESTAURANTS
   - Only returns approved restaurants (is_approved = TRUE)
   - Attaches real review_count + up to 2 recent review quotes
     from the `reviews` table (no fabricated data)
========================================================= */
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT r.*,
        COALESCE(rc.review_count, 0)::int AS review_count,
        rc.avg_review_rating,
        COALESCE(rq.quotes, '{}') AS review_quotes
      FROM restaurants r

      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS review_count, AVG(rating) AS avg_review_rating
        FROM reviews
        WHERE reviews.restaurant_id = r.restaurant_id
      ) rc ON true

      LEFT JOIN LATERAL (
        SELECT ARRAY_AGG(comment) AS quotes
        FROM (
          SELECT comment
          FROM reviews
          WHERE reviews.restaurant_id = r.restaurant_id
            AND comment IS NOT NULL
            AND comment <> ''
          ORDER BY created_at DESC
          LIMIT 2
        ) top_comments
      ) rq ON true

      WHERE r.is_approved = TRUE

      ORDER BY r.created_at DESC
    `);

    res.json(result.rows || result);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET SINGLE RESTAURANT BY ID
   - Only returns the restaurant if it's approved
   - Returns 404 if not found OR not approved
     (prevents leaking unapproved records via direct URL)
========================================================= */
exports.getRestaurantById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT r.*,
              (SELECT COUNT(*) FROM reviews rv WHERE rv.restaurant_id = r.restaurant_id)::int AS review_count
       FROM restaurants r
       WHERE r.restaurant_id = $1 AND r.is_approved = TRUE`,
      [id]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};