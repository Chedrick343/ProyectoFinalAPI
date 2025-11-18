import { getConnection } from "../config/db.js";

// ============================
// Cambiar estado de cita
// ============================
export const cambiarEstadoCita = async (req, res) => {
  const { idCita, nuevoEstado } = req.body;

  try {
    if (!idCita || nuevoEstado === undefined) {
      return res.status(400).json({ ok: false, msg: "Datos incompletos" });
    }

    const db = getConnection();
    const query = "SELECT * FROM sp_cambiarEstadoCita($1, $2);";
    const result = await db.query(query, [idCita, nuevoEstado]);

    return res.status(200).json({
      ok: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error cambiarEstadoCita:", error);
    return res.status(500).json({ ok: false, msg: "Error en servidor", detalle: error.message });
  }
};


// ============================
// Crear solicitud de cita
// ============================
export const crearSolicitudCita = async (req, res) => {
  const { idUsuario, idTratamiento, horaSolicitud, fechaSolicitud } = req.body;

  try {
    if (!idUsuario || !idTratamiento || !horaSolicitud || !fechaSolicitud) {
      return res.status(400).json({ ok: false, msg: "Datos incompletos" });
    }

    const db = getConnection();
    const query = "SELECT * FROM sp_crearSolicitudCita($1, $2, $3, $4);";
    const result = await db.query(query, [
      idUsuario,
      idTratamiento,
      horaSolicitud,
      fechaSolicitud
    ]);

    return res.status(201).json({
      ok: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error crearSolicitudCita:", error);
    return res.status(500).json({ ok: false, msg: "Error en servidor", detalle: error.message });
  }
};


// ============================
// Obtener citas (opcional filtrado por estado)
// ============================
export const obtenerCitas = async (req, res) => {
  const { estadoCita } = req.query; // true, false o undefined

  try {
    const db = getConnection();
    
    const query = "SELECT * FROM sp_obtenerCitas($1);";
    const result = await db.query(query, [
      estadoCita === undefined ? null : estadoCita
    ]);

    return res.status(200).json({
      ok: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error obtenerCitas:", error);
    return res.status(500).json({ ok: false, msg: "Error en servidor", detalle: error.message });
  }
};


// ============================
// Obtener citas de un usuario
// ============================
export const obtenerCitasUsuario = async (req, res) => {
  const { idUsuario } = req.params;

  try {
    if (!idUsuario) {
      return res.status(400).json({ ok: false, msg: "El idUsuario es obligatorio" });
    }

    const db = getConnection();
    const query = "SELECT * FROM sp_obtenerCitasUsuario($1);";
    const result = await db.query(query, [idUsuario]);

    return res.status(200).json({
      ok: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error obtenerCitasUsuario:", error);
    return res.status(500).json({ ok: false, msg: "Error en servidor", detalle: error.message });
  }
};
