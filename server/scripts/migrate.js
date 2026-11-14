// Applies every SQL file in /supabase/migrations (in name order) to DATABASE_URL.
// Usage:
//   npm run migrate            -> schema only
//   npm run migrate -- --seed  -> schema + /supabase/seed.sql + /supabase/seeds/*.sql
// The SQL files are idempotent, so running this again is safe.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../.env'), quiet: true });

const supabaseDir = path.resolve(here, '../../supabase');
const migrationsDir = path.join(supabaseDir, 'migrations');
const seedFile = path.join(supabaseDir, 'seed.sql');
const seedsDir = path.join(supabaseDir, 'seeds');
const withSeed = process.argv.includes('--seed');

async function applyFile(client, file) {
  const sql = await readFile(file, 'utf8');
  await client.query('begin');
  try {
    await client.query(sql);
    await client.query('commit');
    console.log(`applied ${path.relative(supabaseDir, file)}`);
  } catch (err) {
    await client.query('rollback');
    throw new Error(`${path.basename(file)}: ${err.message}`);
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in server/.env');
  }

  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  const client = new pg.Client({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const files = (await readdir(migrationsDir))
      .filter((name) => name.endsWith('.sql'))
      .sort()
      .map((name) => path.join(migrationsDir, name));

    for (const file of files) {
      await applyFile(client, file);
    }
    if (withSeed) {
      await applyFile(client, seedFile);
      const extraSeeds = (await readdir(seedsDir).catch(() => []))
        .filter((name) => name.endsWith('.sql'))
        .sort();
      for (const name of extraSeeds) {
        await applyFile(client, path.join(seedsDir, name));
      }
    }
    console.log('migration complete');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(`migration failed: ${err.message}`);
  process.exit(1);
});
