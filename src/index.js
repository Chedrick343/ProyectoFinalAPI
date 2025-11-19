import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import productosRoutes from "./routes/productos.routes.js";
import citasRoutes from "./routes/citas.route.js";
import carritoRoutes from "./routes/carrito.route.js";
import tratamientosRoutes from "./routes/tratamientos.route.js";
import { initializeRoles } from "./services/role.service.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/productos", productosRoutes);
app.use("/citas", citasRoutes);
app.use("/carrito", carritoRoutes);
app.use("/tratamientos", tratamientosRoutes);

// Inicializar roles al arrancar el servidor
const initializeApp = async () => {
  try {
    console.log("[INIT] Inicializando aplicación...");
    await initializeRoles();
    console.log("[INIT] Aplicación inicializada correctamente");
  } catch (error) {
    console.error("[INIT] Error al inicializar aplicación:", error);
  }
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Servidor listo en puerto ${PORT}`);
  await initializeApp();
});
