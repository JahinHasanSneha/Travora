const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/suppliers (public, approved only, filterable by business_type)
const listSuppliers = asyncHandler(async (req, res) => {
  const { business_type } = req.query;
  const params = [];
  let sql = `SELECT supplier_id, supplier_name, business_type, address, rating, is_approved
             FROM suppliers WHERE is_approved = TRUE`;
  if (business_type) {
    params.push(business_type);
    sql += ` AND business_type = $${params.length}`;
  }
  sql += ' ORDER BY rating DESC NULLS LAST';
  const result = await db.query(sql, params);
  res.json(result.rows);
});

// GET /api/suppliers/me
const mySupplier = asyncHandler(async (req, res) => {
  const result = await db.query('SELECT * FROM suppliers WHERE user_id = $1', [req.user.user_id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Supplier profile not found.' });
  res.json(result.rows[0]);
});

// PATCH /api/suppliers/me
const updateMySupplier = asyncHandler(async (req, res) => {
  const { supplier_name, business_registration, contact_phone, contact_email, address } = req.body;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE suppliers SET
        supplier_name = COALESCE($1, supplier_name),
        business_registration = COALESCE($2, business_registration),
        contact_phone = COALESCE($3, contact_phone),
        contact_email = COALESCE($4, contact_email),
        address = COALESCE($5, address)
       WHERE user_id = $6 RETURNING *`,
      [supplier_name, business_registration, contact_phone, contact_email, address, req.user.user_id]
    );
    await client.query('COMMIT');
    if (!result.rows[0]) return res.status(404).json({ error: 'Supplier profile not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = { listSuppliers, mySupplier, updateMySupplier };
