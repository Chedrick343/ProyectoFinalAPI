import { Router } from "express";
import { subirImagen, upload } from "../controllers/upload.controller.js";

const router = Router();

// Subir imagen (multer maneja el multipart/form-data)
router.post("/imagen", upload.single('image'), subirImagen);

export default router;
