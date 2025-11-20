import { getConnection } from "../config/db.js";
import bcrypt from "bcryptjs";
import { generateOTP, saveOTP, verifyOTP, sendOTPSMS } from "../services/otp.service.js";
import { initializeRoles, getRoleIdByName, isFirstUser } from "../services/role.service.js";

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

    const db = getConnection();

    // Inicializar roles si no existen
    await initializeRoles();

    // Verificar si es el primer usuario
    const esPrimerUsuario = await isFirstUser();

    // Determinar el rol: primer usuario = Administrador, resto = Cliente
    const nombreRol = esPrimerUsuario ? "Administrador" : "Cliente";
    const idRol = await getRoleIdByName(nombreRol);

    console.log(`[REGISTRO] Registrando usuario como: ${nombreRol} (es primer usuario: ${esPrimerUsuario})`);

    // Verificar si el nombre de usuario ya existe
    const checkUserQuery = "SELECT idusuario FROM usuario WHERE nombreusuario = $1";
    const checkResult = await db.query(checkUserQuery, [nombreUsuario]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        ok: false,
        msg: "El nombre de usuario ya está en uso"
      });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Insertar el usuario con el rol correspondiente
    const insertQuery = `
      INSERT INTO usuario (nombre, apellido, telefono, nombreusuario, passwordhash, idrol) 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING idusuario, nombre, apellido, nombreusuario;
    `;

    const insertResult = await db.query(insertQuery, [
      nombre,
      apellido,
      telefono,
      nombreUsuario,
      passwordHash,
      idRol
    ]);

    const nuevoUsuario = insertResult.rows[0];

    console.log(`[REGISTRO] Usuario creado exitosamente: ${nuevoUsuario.idusuario} - ${nombreRol}`);

    // Éxito
    return res.status(201).json({
      ok: true,
      mensaje: `Usuario registrado exitosamente como ${nombreRol}`,
      usuario: nuevoUsuario.nombreusuario,
      idUsuario: nuevoUsuario.idusuario,
      rol: nombreRol
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


// ==========================
// OBTENER ROLES DISPONIBLES
// ==========================
export const obtenerRoles = async (req, res) => {
  try {
    const db = getConnection();
    const query = "SELECT idrol, nombrerol FROM rolusuario ORDER BY nombrerol;";
    const result = await db.query(query);

    return res.status(200).json({
      ok: true,
      roles: result.rows
    });

  } catch (error) {
    console.error("Error en obtenerRoles:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
      detalle: error.message
    });
  }
};

// ==========================
// OBTENER PERFIL DE USUARIO
// ==========================
export const obtenerPerfil = async (req, res) => {
  try {
    const { idUsuario } = req.params;

    if (!idUsuario) {
      return res.status(400).json({
        ok: false,
        msg: "El ID de usuario es obligatorio"
      });
    }

    const db = getConnection();
    
    // SELECT directo sin stored procedure
    const query = `
      SELECT 
        u.idusuario,
        u.nombre,
        u.apellido,
        u.telefono,
        u.nombreusuario,
        r.nombrerol as rol
      FROM usuario u
      LEFT JOIN rolusuario r ON u.idrol = r.idrol
      WHERE u.idusuario = $1
    `;
    
    const result = await db.query(query, [idUsuario]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Usuario no encontrado"
      });
    }

    return res.status(200).json({
      ok: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error en obtenerPerfil:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
      detalle: error.message
    });
  }
};
