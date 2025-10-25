import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// --- Schema & seed ---
async function init() {
  await query(`
    CREATE TABLE IF NOT EXISTS proveedores (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      iva NUMERIC NOT NULL DEFAULT 21,
      percepcion NUMERIC NOT NULL DEFAULT 0,
      descuento NUMERIC NOT NULL DEFAULT 0
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS productos (
      id SERIAL PRIMARY KEY,
      codigo TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
      costo_neto NUMERIC NOT NULL DEFAULT 0,
      tipo TEXT,
      margen NUMERIC NOT NULL DEFAULT 0,
      precio_final NUMERIC NOT NULL DEFAULT 0
    );
  `);

  // Seed demo data if empty
  const provCount = await query('SELECT COUNT(*)::int FROM proveedores');
  if (provCount.rows[0].count === 0) {
    await query(`
      INSERT INTO proveedores (nombre, iva, percepcion, descuento) VALUES
      ('Proveedor A', 21, 3, 5),
      ('Proveedor B', 10.5, 2, 0),
      ('Proveedor C', 0, 0, 0);
    `);
  }

  const prodCount = await query('SELECT COUNT(*)::int FROM productos');
  if (prodCount.rows[0].count === 0) {
    // Assume proveedor A id 1, B id 2, C id 3 (fresh DB)
    await query(`
      INSERT INTO productos (codigo, nombre, proveedor_id, costo_neto, tipo, margen, precio_final) VALUES
      ('1001', 'Queso Cremoso x Kg', 1, 2500, 'pesable', 40, 0),
      ('1002', 'Jamón Cocido x Kg', 1, 3200, 'pesable', 40, 0),
      ('2001', 'Galletitas Surtidas', 2, 800, 'comestible', 35, 0);
    `);
  }
}

init().then(() => console.log('✅ DB ready')).catch(err => {
  console.error('DB init error', err);
  process.exit(1);
});

// Helpers
function num(v, def=0) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : def;
}

// --- Proveedores endpoints ---
app.get('/proveedores', async (req, res) => {
  const r = await query('SELECT * FROM proveedores ORDER BY id ASC');
  res.json(r.rows);
});

app.post('/proveedores', async (req, res) => {
  const { nombre, iva, percepcion, descuento } = req.body;
  await query(
    'INSERT INTO proveedores (nombre, iva, percepcion, descuento) VALUES ($1, $2, $3, $4)',
    [nombre, num(iva), num(percepcion), num(descuento)]
  );
  res.json({ message: 'Proveedor agregado' });
});

app.put('/proveedores/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, iva, percepcion, descuento } = req.body;
  await query(
    'UPDATE proveedores SET nombre=$1, iva=$2, percepcion=$3, descuento=$4 WHERE id=$5',
    [nombre, num(iva), num(percepcion), num(descuento), id]
  );
  res.json({ message: 'Proveedor actualizado' });
});

app.delete('/proveedores/:id', async (req, res) => {
  const { id } = req.params;
  await query('DELETE FROM proveedores WHERE id=$1', [id]);
  res.json({ message: 'Proveedor eliminado' });
});

// --- Productos endpoints ---
app.get('/productos', async (req, res) => {
  const { q } = req.query; // buscar por codigo o nombre
  if (q) {
    const r = await query(
      `SELECT p.*, pr.nombre as proveedor_nombre
       FROM productos p LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
       WHERE p.codigo ILIKE $1 OR p.nombre ILIKE $1
       ORDER BY p.id DESC`,
      ['%' + q + '%']
    );
    return res.json(r.rows);
  }
  const r = await query(
    `SELECT p.*, pr.nombre as proveedor_nombre
     FROM productos p LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
     ORDER BY p.id DESC`
  );
  res.json(r.rows);
});

app.get('/productos/:codigo', async (req, res) => {
  const { codigo } = req.params;
  const r = await query(
    `SELECT p.*, pr.nombre as proveedor_nombre
     FROM productos p LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
     WHERE p.codigo = $1`,
    [codigo]
  );
  if (!r.rows[0]) return res.status(404).json({ message: 'Producto no encontrado' });
  res.json(r.rows[0]);
});

app.post('/productos', async (req, res) => {
  const { codigo, nombre, proveedor_id, costo_neto, tipo, margen, precio_final } = req.body;
  await query(
    `INSERT INTO productos (codigo, nombre, proveedor_id, costo_neto, tipo, margen, precio_final)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [codigo, nombre, proveedor_id || null, num(costo_neto), tipo || null, num(margen), num(precio_final)]
  );
  res.json({ message: 'Producto agregado' });
});

app.put('/productos/:id', async (req, res) => {
  const { id } = req.params;
  const { codigo, nombre, proveedor_id, costo_neto, tipo, margen, precio_final } = req.body;
  await query(
    `UPDATE productos SET codigo=$1, nombre=$2, proveedor_id=$3, costo_neto=$4, tipo=$5, margen=$6, precio_final=$7 WHERE id=$8`,
    [codigo, nombre, proveedor_id || null, num(costo_neto), tipo || null, num(margen), num(precio_final), id]
  );
  res.json({ message: 'Producto actualizado' });
});

app.delete('/productos/:id', async (req, res) => {
  const { id } = req.params;
  await query('DELETE FROM productos WHERE id=$1', [id]);
  res.json({ message: 'Producto eliminado' });
});

app.listen(PORT, () => {
  console.log(`✅ Backend on http://localhost:${PORT}`);
});

