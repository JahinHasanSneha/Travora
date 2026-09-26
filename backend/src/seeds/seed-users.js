const bcrypt = require('bcrypt');
const { pool } = require('../config/db'); // adjust path if needed
require('dotenv').config();

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

async function seedUsers() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const users = [
      { email: 'admin@tripclone.dev', name: 'Platform Admin', type: 'admin' },
      { email: 'traveler@tripclone.dev', name: 'Demo Traveler', type: 'traveler' },
      { email: 'company@tripclone.dev', name: 'Wanderlust Tours', type: 'travel_company' },
      { email: 'hotel_owner@tripclone.dev', name: 'Paris Grand Hotels', type: 'supplier' },
      { email: 'restaurant_owner@tripclone.dev', name: 'Paris Bistro Group', type: 'supplier' },
      { email: 'cruise_owner@tripclone.dev', name: 'Seine River Cruises', type: 'supplier' },
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO users (email, password_hash, full_name, user_type, is_verified, profile_picture)
         VALUES ($1, $2, $3, $4, TRUE, $5)
         ON CONFLICT (email) DO NOTHING`,
        [u.email, passwordHash, u.name, u.type, getRandomPic()]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Users seeded');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Users seed failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = seedUsers;