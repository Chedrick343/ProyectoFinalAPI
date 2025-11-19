import { Router } from "express";
import { 
  obtenerProductos,
  obtenerDetalleProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} from "../controllers/productos.controller.js";

const router = Router();

// ========== Rutas públicas/cliente ==========

// Obtener todos los productos
router.get("/", obtenerProductos);

// Obtener detalle de un producto específico
router.get("/:idProducto", obtenerDetalleProducto);

// ========== Rutas de administrador ==========

// Gestión de productos
router.post("/admin", crearProducto);
router.put("/admin/:idProducto", actualizarProducto);
router.delete("/admin/:idProducto", eliminarProducto);

export default router;
