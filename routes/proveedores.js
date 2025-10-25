import express from "express";
import { query } from "../db.js";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await query("SELECT * FROM proveedores ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nombre, iva, percepcion, descuento } = req.body;
    const result = await query(
      "INSERT INTO proveedores (nombre, iva, percepcion, descuento) VALUES ($1,$2,$3,$4) RETURNING *",
      [nombre, iva, percepcion, descuento]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al guardar proveedor" });
  }
});

export default router;
