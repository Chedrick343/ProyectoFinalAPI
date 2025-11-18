import { Router } from "express";
import { iniciarSesion, registrarUsuario } from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", iniciarSesion);
router.post("/register", registrarUsuario);

export default router;
