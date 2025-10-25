import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDB } from "./db.js";
import proveedoresRoutes from "./routes/proveedores.js";
import productosRoutes from "./routes/productos.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("✅ API Calculadora en funcionamiento"));
app.use("/proveedores", proveedoresRoutes);
app.use("/productos", productosRoutes);

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Servidor activo en puerto ${PORT}`));
});
