const { pool } = require('../config/db');   // <-- IMPORT POOL

const seedUsers = require('./seed-users');
const seedCompanies = require('./seed-companies');
const seedSuppliers = require('./seed-suppliers');
const seedPlaces = require('./seed-places');
const seedHotels = require('./seed-hotels');
const seedRestaurants = require('./seed-restaurants');
const seedCruises = require('./seed-cruises');
const seedPackages = require('./seed-packages');

async function runAll() {
  try {
    await seedUsers();
    await seedCompanies();
    await seedSuppliers();
    await seedPlaces();
    await seedHotels();
    await seedRestaurants();
    await seedCruises();
    await seedPackages();
    console.log('🎉 All seeds completed successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end(); // now pool is defined
  }
}

runAll();