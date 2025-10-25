import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

export async function initDB() {
  await query(`
    CREATE TABLE IF NOT EXISTS proveedores (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      iva NUMERIC DEFAULT 21,
      percepcion NUMERIC DEFAULT 0,
      descuento NUMERIC DEFAULT 0
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS productos (
      id SERIAL PRIMARY KEY,
      codigo TEXT,
      nombre TEXT NOT NULL,
      precio NUMERIC DEFAULT 0
    );
  `);

  console.log("✅ Base de datos inicializada correctamente");
}
