import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Missing DATABASE_URL in .env');
  process.exit(1);
}

export const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false }
});

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}
