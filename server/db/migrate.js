import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createDirectPool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export async function runMigrations() {
  console.log('[Migrations] Connecting to PostgreSQL database (direct compute)...');
  const migrationPool = await createDirectPool();

  try {
    // Ensure migrations tracking table exists
    await migrationPool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const executedRes = await migrationPool.query('SELECT version FROM schema_migrations;');
    const executedSet = new Set(executedRes.rows.map((r) => r.version));

    for (const file of files) {
      if (!executedSet.has(file)) {
        console.log(`[Migrations] Applying ${file}...`);
        const filePath = path.join(MIGRATIONS_DIR, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        const client = await migrationPool.connect();
        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (version) VALUES ($1);', [file]);
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }

        console.log(`[Migrations] Successfully applied ${file}`);
      } else {
        console.log(`[Migrations] Skipping already applied ${file}`);
      }
    }

    console.log('[Migrations] All migrations up to date.');
  } finally {
    await migrationPool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('[Migrations] Completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migrations] Failed:', err);
      process.exit(1);
    });
}
