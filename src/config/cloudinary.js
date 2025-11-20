import { v2 as cloudinary } from 'cloudinary';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret'
});

/**
 * Sube una imagen a Cloudinary
 * @param {Buffer} fileBuffer - Buffer de la imagen
 * @param {string} folder - Carpeta en Cloudinary (tratamientos, productos, categorias)
 * @returns {Promise<string>} URL de la imagen subida
 */
export const uploadImage = async (fileBuffer, folder = 'salon') => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `salon/${folder}`,
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('[CLOUDINARY] Error al subir imagen:', error);
            reject(error);
          } else {
            console.log('[CLOUDINARY] Imagen subida exitosamente:', result.secure_url);
            resolve(result.secure_url);
          }
        }
      );
      
      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('[CLOUDINARY] Error en uploadImage:', error);
    throw error;
  }
};

/**
 * Elimina una imagen de Cloudinary
 * @param {string} imageUrl - URL de la imagen a eliminar
 */
export const deleteImage = async (imageUrl) => {
  try {
    // Extraer el public_id de la URL
    const parts = imageUrl.split('/');
    const fileWithExtension = parts[parts.length - 1];
    const publicId = fileWithExtension.split('.')[0];
    const folder = parts[parts.length - 2];
    
    const fullPublicId = `salon/${folder}/${publicId}`;
    
    const result = await cloudinary.uploader.destroy(fullPublicId);
    console.log('[CLOUDINARY] Imagen eliminada:', fullPublicId, result);
    return result;
  } catch (error) {
    console.error('[CLOUDINARY] Error al eliminar imagen:', error);
    throw error;
  }
};

export default cloudinary;
