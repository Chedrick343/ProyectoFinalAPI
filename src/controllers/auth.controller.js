import { getConnection } from "../config/db.js";
import bcrypt from "bcryptjs";
import { generateOTP, saveOTP, verifyOTP, sendOTPSMS } from "../services/twilio.service.js";

// ==========================
// INICIAR SESIÓN
// ==========================
export const iniciarSesion = async (req, res) => {
  const { nombreUsuario, password } = req.body;

  try {
    if (!nombreUsuario || !password) {
      return res.status(400).json({
        ok: false,
        msg: "Nombre de usuario y contraseña son obligatorios"
      });
    }

    const db = getConnection();   // Obtenemos el pool

    // Ejecutar función de PostgreSQL
    const query = "SELECT * FROM sp_iniciarSesion($1);";
    const result = await db.query(query, [nombreUsuario]);

    const data = result.rows[0];

    // Validación
    if (!data || !data.idusuario || !data.passwordhash) {
      return res.status(401).json({
        ok: false,
        msg: "Credenciales incorrectas"
      });
    }

    // Verificación de contraseña
    const passwordValida = await bcrypt.compare(password, data.passwordhash);
    if (!passwordValida) {
      return res.status(401).json({
        ok: false,
        msg: "Credenciales incorrectas"
      });
    }

    // Éxito
    return res.status(200).json({
      ok: true,
      idUsuario: data.idusuario,
      rol: data.nombrerol
    });

  } catch (error) {
    console.error("Error login:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
      detalle: error.message
    });
  }
};


// ==========================
// REGISTRAR USUARIO
// ==========================
export const registrarUsuario = async (req, res) => {
  try {
    const { nombre, apellido, telefono, nombreUsuario, password, otp } = req.body;

    // Validación
    if (!nombre || !apellido || !nombreUsuario || !password || !telefono || !otp) {
      return res.status(400).json({
        ok: false,
        msg: "Faltan datos obligatorios (nombre, apellido, telefono, nombreUsuario, password, otp)"
      });
    }

    // Verificar OTP
    if (!verifyOTP(telefono, otp)) {
      return res.status(400).json({
        ok: false,
        msg: "Código OTP inválido o expirado"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const db = getConnection();

    // Ejecutar función de PostgreSQL
    const query = "SELECT * FROM sp_registroCliente($1, $2, $3, $4, $5);";
    const result = await db.query(query, [
      nombre,
      apellido,
      telefono,
      nombreUsuario,
      passwordHash
    ]);

    const data = result.rows[0];

    // El procedimiento siempre devuelve una fila, revisar si el mensaje indica error
    if (!data) {
      return res.status(500).json({
        ok: false,
        msg: "No se obtuvo respuesta del procedimiento almacenado"
      });
    }

    // Si el mensaje contiene "Error:", significa que falló
    if (data.mensaje && data.mensaje.toLowerCase().includes("error")) {
      return res.status(400).json({
        ok: false,
        msg: data.mensaje
      });
    }

    // Éxito
    return res.status(201).json({
      ok: true,
      mensaje: data.mensaje,
      usuario: data.usuario,
      idUsuario: data.idcreado,
      rol: data.rol
    });

  } catch (error) {
    console.error("Error en registrarUsuario:", error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
      detalle: error.message,
      error: error.toString()
    });
  }
};


// ==========================
// SOLICITAR OTP PARA REGISTRO
// ==========================
export const solicitarOTP = async (req, res) => {
  try {
    const { telefono } = req.body;

    if (!telefono) {
      return res.status(400).json({
        ok: false,
        msg: "El teléfono es obligatorio"
      });
    }

    // Generar OTP
    const otp = generateOTP();
    
    // Guardar en memoria
    saveOTP(telefono, otp, 5);

    // Enviar SMS
    try {
      const result = await sendOTPSMS(telefono, otp);
      
      return res.status(200).json({
        ok: true,
        msg: "OTP enviado exitosamente",
        expiresIn: 300, // 5 minutos en segundos
        // Solo en desarrollo, devolver el OTP
        ...(result.devMode && { otp: result.otp })
      });
    } catch (smsError) {
      // Si falla el envío de SMS, igual guardamos el OTP y lo mostramos en consola
      console.error("[OTP] Error enviando SMS, pero OTP guardado:", otp);
      return res.status(200).json({
        ok: true,
        msg: "OTP generado (ver consola del servidor)",
        expiresIn: 300,
        otp // En desarrollo, devolver siempre el OTP
      });
    }

  } catch (error) {
    console.error("Error en solicitarOTP:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
      detalle: error.message
    });
  }
};


// ==========================
// REENVIAR OTP
// ==========================
export const reenviarOTP = async (req, res) => {
  try {
    const { telefono } = req.body;

    if (!telefono) {
      return res.status(400).json({
        ok: false,
        msg: "El teléfono es obligatorio"
      });
    }

    // Generar nuevo OTP
    const otp = generateOTP();
    
    // Guardar en memoria (sobrescribe el anterior)
    saveOTP(telefono, otp, 5);

    // Enviar SMS
    try {
      const result = await sendOTPSMS(telefono, otp);
      
      return res.status(200).json({
        ok: true,
        msg: "OTP reenviado exitosamente",
        expiresIn: 300,
        ...(result.devMode && { otp: result.otp })
      });
    } catch (smsError) {
      console.error("[OTP] Error reenviando SMS, pero OTP guardado:", otp);
      return res.status(200).json({
        ok: true,
        msg: "OTP generado (ver consola del servidor)",
        expiresIn: 300,
        otp
      });
    }

  } catch (error) {
    console.error("Error en reenviarOTP:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
      detalle: error.message
    });
  }
};


// ==========================
// SOLICITAR OTP PARA CAMBIO DE CONTRASEÑA
// ==========================
export const solicitarOTPCambioPassword = async (req, res) => {
  try {
    const { nombreUsuario } = req.body;

    if (!nombreUsuario) {
      return res.status(400).json({
        ok: false,
        msg: "El nombre de usuario es obligatorio"
      });
    }

    const db = getConnection();

    // Buscar el teléfono asociado al usuario
    const query = "SELECT telefono FROM usuario WHERE nombreUsuario = $1";
    const result = await db.query(query, [nombreUsuario]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Usuario no encontrado"
      });
    }

    const telefono = result.rows[0].telefono;

    if (!telefono) {
      return res.status(400).json({
        ok: false,
        msg: "Este usuario no tiene un teléfono registrado"
      });
    }

    // Generar OTP
    const otp = generateOTP();
    
    // Guardar en memoria
    saveOTP(telefono, otp, 5);

    // Enviar SMS
    try {
      const result = await sendOTPSMS(telefono, otp);
      
      return res.status(200).json({
        ok: true,
        msg: "OTP enviado a tu teléfono registrado",
        telefono: telefono.substring(0, 3) + "****" + telefono.slice(-2), // Parcialmente oculto
        expiresIn: 300,
        ...(result.devMode && { otp: result.otp })
      });
    } catch (smsError) {
      console.error("[OTP] Error enviando SMS, pero OTP guardado:", otp);
      return res.status(200).json({
        ok: true,
        msg: "OTP generado (ver consola del servidor)",
        telefono: telefono.substring(0, 3) + "****" + telefono.slice(-2),
        expiresIn: 300,
        otp
      });
    }

  } catch (error) {
    console.error("Error en solicitarOTPCambioPassword:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
      detalle: error.message
    });
  }
};


// ==========================
// CAMBIAR CONTRASEÑA CON OTP
// ==========================
export const cambiarPasswordConOTP = async (req, res) => {
  try {
    const { nombreUsuario, otp, nuevaPassword } = req.body;

    if (!nombreUsuario || !otp || !nuevaPassword) {
      return res.status(400).json({
        ok: false,
        msg: "Faltan datos obligatorios (nombreUsuario, otp, nuevaPassword)"
      });
    }

    const db = getConnection();

    // Buscar el teléfono del usuario
    const queryUser = "SELECT telefono FROM usuario WHERE nombreUsuario = $1";
    const resultUser = await db.query(queryUser, [nombreUsuario]);

    if (resultUser.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Usuario no encontrado"
      });
    }

    const telefono = resultUser.rows[0].telefono;

    // Verificar OTP
    if (!verifyOTP(telefono, otp)) {
      return res.status(400).json({
        ok: false,
        msg: "Código OTP inválido o expirado"
      });
    }

    // Hashear nueva contraseña
    const nuevoPasswordHash = await bcrypt.hash(nuevaPassword, 10);

    // Actualizar contraseña
    const queryUpdate = "UPDATE usuario SET passwordHash = $1 WHERE nombreUsuario = $2";
    await db.query(queryUpdate, [nuevoPasswordHash, nombreUsuario]);

    return res.status(200).json({
      ok: true,
      msg: "Contraseña actualizada exitosamente"
    });

  } catch (error) {
    console.error("Error en cambiarPasswordConOTP:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
      detalle: error.message
    });
  }
};
