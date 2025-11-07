/**
 * Apply database schema to Turso
 */
import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.development.local
config({ path: '.env.development.local' });

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('❌ TURSO_DATABASE_URL or DATABASE_URL not found in environment');
  process.exit(1);
}

if (!authToken) {
  console.error('❌ TURSO_AUTH_TOKEN not found in environment');
  process.exit(1);
}

console.log(`📡 Connecting to: ${url.substring(0, 30)}...`);

const client = createClient({
  url,
  authToken,
});

async function migrate() {
  try {
    const migrationSQL = fs.readFileSync(
      path.join(process.cwd(), 'prisma', 'migrations', '0_init', 'migration.sql'),
      'utf-8'
    );

    console.log('Applying migration to Turso database...');
    await client.execute(migrationSQL);
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
