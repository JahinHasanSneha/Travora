const { Pool } = require('pg');
require('dotenv').config();

// Determine if SSL should be enabled based on PGSSL env or if connecting to a Neon host
const isNeon = process.env.DATABASE_URL?.includes('neon.tech');
const useSSL = process.env.PGSSL === 'true' || isNeon || process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
// Pool manages multiple reusable connections 
// between the Node.js application and PostgreSQL.