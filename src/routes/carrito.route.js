import { Router } from "express";
import {
  actualizarCantidad,
  agregarACarrito,
  obtenerCarritoUsuario,
  quitarDeCarrito,
  vaciarCarrito
} from "../controllers/carrito.controller.js";

const router = Router();

router.get("/:idUsuario", obtenerCarritoUsuario);
router.post("/agregar", agregarACarrito);
router.put("/cantidad", actualizarCantidad);
router.delete("/quitar", quitarDeCarrito);
router.delete("/vaciar", vaciarCarrito);

export default router;
