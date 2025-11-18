import { getConnection } from "../config/db.js";
import bcrypt from "bcryptjs";

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
    const { nombre, apellido, telefono, nombreUsuario, password } = req.body;

    // Validación
    if (!nombre || !apellido || !nombreUsuario || !password) {
      return res.status(400).json({
        ok: false,
        msg: "Faltan datos obligatorios"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const db = getConnection();

    // Ejecutar función de PostgreSQL
    const query = "SELECT * FROM sp_registroCliente($1, $2, $3, $4, $5);";
    const result = await db.query(query, [
      nombre,
      apellido,
      telefono || null,
      nombreUsuario,
      passwordHash
    ]);

    const data = result.rows[0];

    if (!data || data.mensaje?.toLowerCase().includes("error")) {
      return res.status(400).json({
        ok: false,
        msg: data?.mensaje || "Error desconocido en la creación"
      });
    }

    return res.status(201).json({
      ok: true,
      mensaje: data.mensaje,
      usuario: data.usuario,
      idUsuario: data.idcreado,
      rol: data.rol
    });

  } catch (error) {
    console.error("Error en registrarUsuario:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
      detalle: error.message
    });
  }
};
