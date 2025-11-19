import { Router } from "express";
import {
  iniciarSesion,
  registrarUsuario,
  solicitarOTP,
  reenviarOTP,
  solicitarOTPCambioPassword,
  cambiarPasswordConOTP,
  obtenerRoles
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", iniciarSesion);
router.post("/register", registrarUsuario);
router.post("/request-otp", solicitarOTP);
router.post("/resend-otp", reenviarOTP);
router.post("/request-password-reset-otp", solicitarOTPCambioPassword);
router.post("/reset-password", cambiarPasswordConOTP);
router.get("/roles", obtenerRoles);

export default router;
