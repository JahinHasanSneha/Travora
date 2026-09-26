const { pool } = require('../config/db');

async function seedHotels() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get supplier_id for hotel
    const supplierRes = await client.query(
      `SELECT supplier_id FROM suppliers WHERE business_type = 'hotel' LIMIT 1`
    );
    if (supplierRes.rows.length === 0) {
      console.warn('⚠️  No hotel supplier found, skipping hotels');
      return;
    }
    const supplierId = supplierRes.rows[0].supplier_id;

    const hotels = [
      ['Hotel Le Marais', 48.8586, 2.3622, 4, 120.0, 4.5, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'],
      ['Grand Paris Central', 48.8656, 2.3212, 5, 280.0, 4.7, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
      ['Budget Stay Paris', 48.8434, 2.3488, 2, 65.0, 3.9, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
    ];

    for (const [name, lat, lng, stars, price, rating, img] of hotels) {
      await client.query(
        `INSERT INTO hotels (supplier_id, name, address, city, country, latitude, longitude, star_rating, price_per_night, total_rooms, available_rooms, rating, image_url, is_approved)
         VALUES ($1,$2,'Demo address','Paris','France',$3,$4,$5,$6,20,20,$7,$8, TRUE)
         ON CONFLICT DO NOTHING`,
        [supplierId, name, lat, lng, stars, price, rating, img]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Hotels seeded');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Hotels seed failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = seedHotels;