import { Router } from "express";
import { 
  obtenerTratamientos,
  obtenerTiposTratamiento,
  obtenerTratamientosPorTipo,
  obtenerDetalleTratamiento,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  crearTratamiento,
  actualizarTratamiento,
  eliminarTratamiento
} from "../controllers/tratamientos.controller.js";

const router = Router();

// ========== Rutas públicas/cliente ==========

// Obtener todos los tratamientos
router.get("/", obtenerTratamientos);

// Obtener todos los tipos/categorías de tratamiento
router.get("/tipos", obtenerTiposTratamiento);

// Obtener tratamientos por tipo/categoría
router.get("/tipo/:idTipo", obtenerTratamientosPorTipo);

// Obtener detalle de un tratamiento específico
router.get("/:idTratamiento", obtenerDetalleTratamiento);

// ========== Rutas de administrador ==========

// Gestión de categorías
router.post("/admin/categorias", crearCategoria);
router.put("/admin/categorias/:idCategoria", actualizarCategoria);
router.delete("/admin/categorias/:idCategoria", eliminarCategoria);

// Gestión de tratamientos
router.post("/admin", crearTratamiento);
router.put("/admin/:idTratamiento", actualizarTratamiento);
router.delete("/admin/:idTratamiento", eliminarTratamiento);

export default router;
