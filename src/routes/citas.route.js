import { Router } from "express";
import {
  cambiarEstadoCita,
  crearSolicitudCita,
  obtenerCitas,
  obtenerCitasUsuario
} from "../controllers/citas.controller.js";

const router = Router();

router.put("/estado", cambiarEstadoCita);
router.post("/crear", crearSolicitudCita);
router.get("/", obtenerCitas);
router.get("/usuario/:idUsuario", obtenerCitasUsuario);

export default router;
