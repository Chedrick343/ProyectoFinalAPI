// Servicio de OTP sin dependencias externas (Twilio removido)
// Almacenamiento temporal de OTPs (en memoria)
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
 * Simula el envío de SMS retornando el OTP generado
 * (Para uso en desarrollo sin servicio SMS real)
 * @param {string} telefono - Número de teléfono destino
 * @param {string} otp - Código OTP a "enviar"
 * @returns {Promise}
 */
export async function sendOTPSMS(telefono, otp) {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log(`[OTP SIMULADO] Código para ${telefono}: ${otp}`);
  
  // Retornar el OTP para mostrarlo en la app (simulando SMS)
  return { success: true, devMode: true, otp };
}
