const { pool } = require('../config/db');

async function seedSuppliers() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const supplierEmails = [
      { email: 'hotel_owner@tripclone.dev', name: 'Paris Grand Hotels', type: 'hotel' },
      { email: 'restaurant_owner@tripclone.dev', name: 'Paris Bistro Group', type: 'restaurant' },
      { email: 'cruise_owner@tripclone.dev', name: 'Seine River Cruises', type: 'cruise' },
    ];

    for (const s of supplierEmails) {
      const userRes = await client.query(
        `SELECT user_id FROM users WHERE email = $1`,
        [s.email]
      );
      if (userRes.rows.length === 0) {
        console.warn(`⚠️  User ${s.email} not found, skipping supplier`);
        continue;
      }
      const userId = userRes.rows[0].user_id;

      await client.query(
        `INSERT INTO suppliers (user_id, supplier_name, business_type, is_approved)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, s.name, s.type]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Suppliers seeded');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Suppliers seed failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = seedSuppliers;