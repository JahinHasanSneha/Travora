const { pool } = require('../config/db');

async function seedCruises() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const supplierRes = await client.query(
      `SELECT supplier_id FROM suppliers WHERE business_type = 'cruise' LIMIT 1`
    );
    if (supplierRes.rows.length === 0) {
      console.warn('⚠️  No cruise supplier found, skipping cruise');
      return;
    }
    const supplierId = supplierRes.rows[0].supplier_id;

    await client.query(
      `INSERT INTO cruises (supplier_id, company_name, ship_name, departure_port, arrival_port, route_description, duration_days, price_per_person, max_passengers, available_tickets, rating, image_url, is_approved)
       VALUES ($1,'Seine River Cruises','Le Bateau Mouche','Port de la Bourdonnais','Port de la Bourdonnais','1-hour scenic Seine river cruise',1,18.0,200,200,4.5,'https://images.unsplash.com/photo-1548574505-5e2386903d8f?auto=format&fit=crop&w=800&q=80', TRUE)
       ON CONFLICT DO NOTHING`,
      [supplierId]
    );

    await client.query('COMMIT');
    console.log('✅ Cruises seeded');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Cruises seed failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = seedCruises;