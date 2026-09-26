// Populates demo data: admin user, a couple of cities' worth of hotels/restaurants/attractions.
// Usage: npm run seed  (run AFTER `npm run migrate`)
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
require('dotenv').config();

// Profile pictures for demo users
const profilePics = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80',
];

function getRandomPic() {
  return profilePics[Math.floor(Math.random() * profilePics.length)];
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // Admin
    const admin = await client.query(
      `INSERT INTO users (email, password_hash, full_name, user_type, is_verified, profile_picture)
       VALUES ('admin@tripclone.dev', $1, 'Platform Admin', 'admin', TRUE, $2)
       ON CONFLICT (email) DO NOTHING RETURNING user_id`,
      [passwordHash, getRandomPic()]
    );

    // Traveler
    await client.query(
      `INSERT INTO users (email, password_hash, full_name, user_type, is_verified, profile_picture)
       VALUES ('traveler@tripclone.dev', $1, 'Demo Traveler', 'traveler', TRUE, $2)
       ON CONFLICT (email) DO NOTHING`,
      [passwordHash, getRandomPic()]
    );

    // Travel company
    const companyUser = await client.query(
      `INSERT INTO users (email, password_hash, full_name, user_type, is_verified, profile_picture)
       VALUES ('company@tripclone.dev', $1, 'Wanderlust Tours', 'travel_company', TRUE, $2)
       ON CONFLICT (email) DO NOTHING RETURNING user_id`,
      [passwordHash, getRandomPic()]
    );
    if (companyUser.rows[0]) {
      await client.query(
        `INSERT INTO travel_companies (user_id, company_name, is_approved) VALUES ($1, 'Wanderlust Tours', TRUE)`,
        [companyUser.rows[0].user_id]
      );
    }

    // Suppliers (hotel, restaurant, cruise)
    const supplierSeeds = [
      ['hotel_owner@tripclone.dev', 'Paris Grand Hotels', 'hotel'],
      ['restaurant_owner@tripclone.dev', 'Paris Bistro Group', 'restaurant'],
      ['cruise_owner@tripclone.dev', 'Seine River Cruises', 'cruise'],
    ];
    const supplierIds = {};
    for (const [email, name, type] of supplierSeeds) {
      const u = await client.query(
        `INSERT INTO users (email, password_hash, full_name, user_type, is_verified, profile_picture)
         VALUES ($1, $2, $3, 'supplier', TRUE, $4) ON CONFLICT (email) DO NOTHING RETURNING user_id`,
        [email, passwordHash, name, getRandomPic()]
      );
      if (u.rows[0]) {
        const s = await client.query(
          `INSERT INTO suppliers (user_id, supplier_name, business_type, is_approved) VALUES ($1,$2,$3,TRUE) RETURNING supplier_id`,
          [u.rows[0].user_id, name, type]
        );
        supplierIds[type] = s.rows[0].supplier_id;
      }
    }

    // Cached attractions (Paris) – all have image_url
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
         VALUES ($1,$2,'Paris','France',$3,$4,$5,$6,'attraction',$7, TRUE)`,
        [name, address, lat, lng, rating, priceLevel, img]
      );
    }

    // Hotels
    if (supplierIds.hotel) {
      const hotels = [
        ['Hotel Le Marais', 48.8586, 2.3622, 4, 120.0, 4.5, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'],
        ['Grand Paris Central', 48.8656, 2.3212, 5, 280.0, 4.7, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
        ['Budget Stay Paris', 48.8434, 2.3488, 2, 65.0, 3.9, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
      ];
      for (const [name, lat, lng, stars, price, rating, img] of hotels) {
        await client.query(
          `INSERT INTO hotels (supplier_id, name, address, city, country, latitude, longitude, star_rating, price_per_night, total_rooms, available_rooms, rating, image_url, is_approved)
           VALUES ($1,$2,'Demo address','Paris','France',$3,$4,$5,$6,20,20,$7,$8, TRUE)`,
          [supplierIds.hotel, name, lat, lng, stars, price, rating, img]
        );
      }
    }

    // Restaurants
    if (supplierIds.restaurant) {
      const restaurants = [
        ['Le Petit Bistro', 'French', 48.8570, 2.3500, 35.0, 4.6, true, false, 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80'],
        ['Vegan Garden Paris', 'Vegan', 48.8620, 2.3450, 28.0, 4.4, true, false, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'],
        ['Halal Grill House', 'Middle Eastern', 48.8700, 2.3600, 22.0, 4.3, true, true, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'],
      ];
      for (const [name, cuisine, lat, lng, cost, rating, veg, halal, img] of restaurants) {
        await client.query(
          `INSERT INTO restaurants (supplier_id, name, cuisine_type, address, city, country, latitude, longitude, avg_meal_cost, rating, has_vegetarian, has_halal, total_tables, available_tables, image_url, is_approved)
           VALUES ($1,$2,$3,'Demo address','Paris','France',$4,$5,$6,$7,$8,$9,15,15,$10, TRUE)`,
          [supplierIds.restaurant, name, cuisine, lat, lng, cost, rating, veg, halal, img]
        );
      }
    }

    // Cruise
    if (supplierIds.cruise) {
      await client.query(
        `INSERT INTO cruises (supplier_id, company_name, ship_name, departure_port, arrival_port, route_description, duration_days, price_per_person, max_passengers, available_tickets, rating, image_url, is_approved)
         VALUES ($1,'Seine River Cruises','Le Bateau Mouche','Port de la Bourdonnais','Port de la Bourdonnais','1-hour scenic Seine river cruise',1,18.0,200,200,4.5,'https://images.unsplash.com/photo-1548574505-5e2386903d8f?auto=format&fit=crop&w=800&q=80', TRUE)`,
        [supplierIds.cruise]
      );
    }

    // Sample active package with image
    const companyRow = await client.query('SELECT company_id FROM travel_companies LIMIT 1');
    if (companyRow.rows[0]) {
      await client.query(
        `INSERT INTO packages (company_id, title, description, destination_city, destination_country, duration_days, base_price, max_group_size, status, slots_available, inclusions, exclusions, image_url, is_approved)
         VALUES ($1, 'Classic Paris Getaway', '4-day guided tour of Paris highlights', 'Paris', 'France', 4, 899.00, 20, 'active', 20,
           ARRAY['Hotel','Breakfast','Guided tours'], ARRAY['Flights','Travel insurance'], 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', TRUE)`,
        [companyRow.rows[0].company_id]
      );
    }

    await client.query('COMMIT');
    console.log('Seed complete. Demo login: any of the emails above / password: Password123!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();