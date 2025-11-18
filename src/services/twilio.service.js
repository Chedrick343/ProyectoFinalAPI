import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Almacenamiento temporal de OTPs (en memoria, solo para pruebas)
const otpStorage = new Map();

/**
 * Genera un código OTP de 6 dígitos
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Guarda el OTP en memoria con el teléfono como clave
 * @param {string} telefono - Número de teléfono
 * @param {string} otp - Código OTP
 * @param {number} expirationMinutes - Minutos de expiración (default 5)
 */
export function saveOTP(telefono, otp, expirationMinutes = 5) {
  const expiration = Date.now() + expirationMinutes * 60 * 1000;
  otpStorage.set(telefono, { otp, expiration });
  console.log(`[OTP] Guardado para ${telefono}: ${otp} (expira en ${expirationMinutes} min)`);
}

/**
 * Verifica si el OTP es válido
 * @param {string} telefono - Número de teléfono
 * @param {string} otp - Código OTP a verificar
 * @returns {boolean}
 */
export function verifyOTP(telefono, otp) {
  const stored = otpStorage.get(telefono);
  
  if (!stored) {
    console.log(`[OTP] No existe OTP para ${telefono}`);
    return false;
  }
  
  if (Date.now() > stored.expiration) {
    console.log(`[OTP] OTP expirado para ${telefono}`);
    otpStorage.delete(telefono);
    return false;
  }
  
  if (stored.otp !== otp) {
    console.log(`[OTP] OTP incorrecto para ${telefono}`);
    return false;
  }
  
  console.log(`[OTP] OTP verificado correctamente para ${telefono}`);
  // Eliminar OTP después de uso exitoso
  otpStorage.delete(telefono);
  return true;
}

/**
 * Envía un SMS con el código OTP
 * @param {string} telefono - Número de teléfono destino
 * @param {string} otp - Código OTP a enviar
 * @returns {Promise}
 */
export async function sendOTPSMS(telefono, otp) {
  try {
    const message = await client.messages.create({
      body: `Tu código de verificación es: ${otp}. Válido por 5 minutos.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: telefono
    });
    
    console.log(`[Twilio] SMS enviado a ${telefono}, SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error(`[Twilio] Error enviando SMS a ${telefono}:`, error.message);
    
    // Para pruebas sin Twilio configurado, retornar el OTP en consola
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV MODE] OTP para ${telefono}: ${otp}`);
      return { success: true, devMode: true, otp };
    }
    
    throw error;
  }
}
