const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/users/:id (self or admin)
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user.user_type !== 'admin' && req.user.user_id !== parseInt(id, 10)) {
    return res.status(403).json({ error: 'Forbidden.' });
  }
  const result = await db.query(
    `SELECT user_id, email, full_name, phone, user_type, is_verified, profile_picture, created_at
     FROM users WHERE user_id = $1`,
    [id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found.' });
  res.json(result.rows[0]);
});

// PATCH /api/users/:id (self only)
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user.user_id !== parseInt(id, 10)) {
    return res.status(403).json({ error: 'You may only edit your own profile.' });
  }
  const { full_name, phone, profile_picture } = req.body;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone),
       profile_picture = COALESCE($3, profile_picture) WHERE user_id = $4
       RETURNING user_id, email, full_name, phone, user_type, is_verified, profile_picture`,
      [full_name, phone, profile_picture, id]
    );
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = { getUser, updateUser };
