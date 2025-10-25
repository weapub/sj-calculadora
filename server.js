import express from "express";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json()); // ← Necesario para leer JSON en el body

// 🔗 Conexión a PostgreSQL (Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ✅ Test de conexión
pool.connect()
  .then(() => console.log("✅ Conectado a PostgreSQL"))
  .catch(err => console.error("❌ Error de conexión:", err));

// ==========================
// 📦 RUTAS DE PROVEEDORES
// ==========================

// 🧾 Listar proveedores
app.get("/proveedores", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM proveedores ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener proveedores:", err);
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
});

// ➕ Crear proveedor
app.post("/proveedores", async (req, res) => {
  try {
    const { nombre, iva, percepcion, descuento } = req.body;
    const result = await pool.query(
      "INSERT INTO proveedores (nombre, iva, percepcion, descuento) VALUES ($1, $2, $3, $4) RETURNING *",
      [nombre, iva, percepcion, descuento]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al guardar proveedor:", err);
    res.status(500).json({ error: "Error al guardar proveedor" });
  }
});

// ==========================
// 🧮 RUTAS DE PRODUCTOS
// ==========================

// 📋 Listar productos
app.get("/productos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM productos ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener productos:", err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// ➕ Crear producto
app.post("/productos", async (req, res) => {
  try {
    const { codigo, nombre, costo_neto, proveedor_id, margen, precio_final } = req.body;
    const result = await pool.query(
      `INSERT INTO productos (codigo, nombre, costo_neto, proveedor_id, margen, precio_final)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [codigo, nombre, costo_neto, proveedor_id, margen, precio_final]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al guardar producto:", err);
    res.status(500).json({ error: "Error al guardar producto" });
  }
});

// ==========================
// ⚙️ SERVER
// ==========================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Servidor escuchando en puerto ${PORT}`));
