const { pool } = require('../config/db');

async function seedPackages() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const companyRes = await client.query(
      `SELECT company_id FROM travel_companies LIMIT 1`
    );
    if (companyRes.rows.length === 0) {
      console.warn('⚠️  No travel company found, skipping package');
      return;
    }
    const companyId = companyRes.rows[0].company_id;

    await client.query(
      `INSERT INTO packages (company_id, title, description, destination_city, destination_country, duration_days, base_price, max_group_size, status, slots_available, inclusions, exclusions, image_url, is_approved)
       VALUES ($1, 'Classic Paris Getaway', '4-day guided tour of Paris highlights', 'Paris', 'France', 4, 899.00, 20, 'active', 20,
         ARRAY['Hotel','Breakfast','Guided tours'], ARRAY['Flights','Travel insurance'], 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', TRUE)
       ON CONFLICT DO NOTHING`,
      [companyId]
    );

    await client.query('COMMIT');
    console.log('✅ Packages seeded');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Packages seed failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = seedPackages;