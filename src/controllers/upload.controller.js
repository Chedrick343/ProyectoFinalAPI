import multer from 'multer';
import { uploadImage } from '../config/cloudinary.js';

// Configurar multer para usar memoria (no guardar en disco)
const storage = multer.memoryStorage();

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    },
    fileFilter: (req, file, cb) => {
        // Aceptar solo imágenes
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'), false);
        }
    }
});

/**
 * Controlador para subir una imagen a Cloudinary
 */
export const subirImagen = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                ok: false,
                msg: 'No se recibió ninguna imagen'
            });
        }

        const { folder = 'general' } = req.body;

        console.log('[UPLOAD] Subiendo imagen, tamaño:', req.file.size, 'bytes, carpeta:', folder);

        // Subir a Cloudinary
        const imageUrl = await uploadImage(req.file.buffer, folder);

        return res.status(200).json({
            ok: true,
            msg: 'Imagen subida exitosamente',
            imageUrl: imageUrl
        });

    } catch (error) {
        console.error('[UPLOAD] Error al subir imagen:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al subir la imagen',
            error: error.message
        });
    }
};
