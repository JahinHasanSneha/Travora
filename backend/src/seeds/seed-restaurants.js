const { pool } = require('../config/db');

async function seedRestaurants() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const supplierRes = await client.query(
      `SELECT supplier_id FROM suppliers WHERE business_type = 'restaurant' LIMIT 1`
    );
    if (supplierRes.rows.length === 0) {
      console.warn('⚠️  No restaurant supplier found, skipping restaurants');
      return;
    }
    const supplierId = supplierRes.rows[0].supplier_id;

    const restaurants = [
      ['Le Petit Bistro', 'French', 48.8570, 2.3500, 35.0, 4.6, true, false, 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80'],
      ['Vegan Garden Paris', 'Vegan', 48.8620, 2.3450, 28.0, 4.4, true, false, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'],
      ['Halal Grill House', 'Middle Eastern', 48.8700, 2.3600, 22.0, 4.3, true, true, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'],
    ];

    for (const [name, cuisine, lat, lng, cost, rating, veg, halal, img] of restaurants) {
      await client.query(
        `INSERT INTO restaurants (supplier_id, name, cuisine_type, address, city, country, latitude, longitude, avg_meal_cost, rating, has_vegetarian, has_halal, total_tables, available_tables, image_url, is_approved)
         VALUES ($1,$2,$3,'Demo address','Paris','France',$4,$5,$6,$7,$8,$9,15,15,$10, TRUE)
         ON CONFLICT DO NOTHING`,
        [supplierId, name, cuisine, lat, lng, cost, rating, veg, halal, img]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Restaurants seeded');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Restaurants seed failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = seedRestaurants;