const { pool } = require('../config/db');

async function seedPlaces() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const attractions = [
      ['Eiffel Tower', 'Champ de Mars', 48.8584, 2.2945, 4.8, 3, 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80'],
      ['Louvre Museum', 'Rue de Rivoli', 48.8606, 2.3376, 4.7, 3, 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80'],
      ['Notre-Dame Cathedral', 'Ile de la Cite', 48.8530, 2.3499, 4.6, 0, 'https://images.unsplash.com/photo-1478359844494-1092259d93e4?auto=format&fit=crop&w=800&q=80'],
      ['Montmartre & Sacre-Coeur', '35 Rue du Chevalier', 48.8867, 2.3431, 4.7, 1, 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80'],
      ["Musee d'Orsay", '1 Rue de la Legion', 48.8600, 2.3266, 4.6, 2, 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?auto=format&fit=crop&w=800&q=80'],
    ];

    for (const [name, address, lat, lng, rating, priceLevel, img] of attractions) {
      await client.query(
        `INSERT INTO cached_places (name, address, city, country, latitude, longitude, rating, price_level, place_type, image_url, is_approved)
         VALUES ($1,$2,'Paris','France',$3,$4,$5,$6,'attraction',$7, TRUE)
         ON CONFLICT DO NOTHING`,
        [name, address, lat, lng, rating, priceLevel, img]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Places seeded');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Places seed failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = seedPlaces;