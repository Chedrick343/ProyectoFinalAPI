import { Router } from "express";
import { obtenerTratamientos } from "../controllers/tratamientos.controller.js";

const router = Router();

router.get("/", obtenerTratamientos);

export default router;
