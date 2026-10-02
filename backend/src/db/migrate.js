// Usage:
//   npm run migrate              -> schema.sql (idempotent base schema) + migrations/*.sql
//   npm run migrate:incremental  -> ONLY migrations/*.sql (what you want on an existing Neon DB)
//

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const onlyMigrations = process.argv.includes('--only-migrations');

async function migrate() {
  const client = await pool.connect();
  try {
    if (!onlyMigrations) {
      console.log('Running base schema (idempotent)...');
      await client.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);

    const dir = path.join(__dirname, 'migrations');
    const files = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
      : [];
    const done = new Set((await client.query('SELECT filename FROM schema_migrations')).rows.map((r) => r.filename));

    for (const file of files) {
      if (done.has(file)) { console.log(`- ${file}: already applied, skipping`); continue; }
      console.log(`- applying ${file} ...`);
      // The file manages its own BEGIN/COMMIT.
      await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
    }
    console.log('Migrations complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
