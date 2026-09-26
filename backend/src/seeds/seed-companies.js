const { pool } = require('../config/db');

async function seedCompanies() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the user_id of the company user
    const userRes = await client.query(
      `SELECT user_id FROM users WHERE email = 'company@tripclone.dev'`
    );
    if (userRes.rows.length === 0) {
      console.warn('⚠️  Company user not found, skipping company seed');
      return;
    }
    const userId = userRes.rows[0].user_id;

    await client.query(
      `INSERT INTO travel_companies (user_id, company_name, is_approved)
       VALUES ($1, 'Wanderlust Tours', TRUE)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    await client.query('COMMIT');
    console.log('✅ Companies seeded');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Companies seed failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = seedCompanies;