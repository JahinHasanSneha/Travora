const db = require('../config/db');

/* =========================================================
   GET ALL CRUISES
   - Only returns approved cruises (is_approved = TRUE)
========================================================= */
exports.getAllCruises = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT c.*,
             (SELECT COUNT(*) FROM reviews rv WHERE rv.cruise_id = c.cruise_id)::int AS review_count
      FROM cruises c
      WHERE c.is_approved = TRUE
      ORDER BY c.created_at DESC
    `);

    res.json(result.rows || result);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET SINGLE CRUISE BY ID
   - Only returns the cruise if it's approved
   - Returns 404 if not found OR not approved (prevents
     leaking unapproved records via direct URL access)
========================================================= */
exports.getCruiseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM reviews rv WHERE rv.cruise_id = c.cruise_id)::int AS review_count
       FROM cruises c
       WHERE c.cruise_id = $1 AND c.is_approved = TRUE`,
      [id]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: 'Cruise not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};