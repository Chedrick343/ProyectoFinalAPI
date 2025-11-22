import { Router } from "express";
import {
  cambiarEstadoCita,
  crearSolicitudCita,
  obtenerCitas,
  obtenerCitasUsuario,
  obtenerCitasPendientes,
  aprobarCita,
  rechazarCita,
  obtenerCalendarioCitas,
  generarFacturaCita,
  pagarCita
} from "../controllers/citas.controller.js";

const router = Router();

// ========== Rutas de cliente ==========
router.put("/estado", cambiarEstadoCita);
router.post("/crear", crearSolicitudCita);
router.get("/", obtenerCitas);
router.get("/usuario/:idUsuario", obtenerCitasUsuario);
router.post("/pagar", pagarCita);

// ========== Rutas de administrador ==========
router.get("/admin/pendientes", obtenerCitasPendientes);
router.get("/admin/calendario", obtenerCalendarioCitas);
router.put("/admin/:idUsuarioCita/aprobar", aprobarCita);
router.put("/admin/:idUsuarioCita/rechazar", rechazarCita);
router.post("/admin/facturas/generar", generarFacturaCita);

export default router;
