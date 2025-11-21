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
    
    // Query directa para actualizar el estado
    const query = `
      UPDATE usuarioxcita
      SET estadocita = $2
      WHERE idcita = $1
      RETURNING idusuariocita, idusuario, idcita, estadocita
    `;
    
    const result = await db.query(query, [idCita, nuevoEstado]);

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, msg: "Cita no encontrada" });
    }

    return res.status(200).json({
      ok: true,
      msg: "Estado de cita actualizado",
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
    
    // Validar que el usuario existe
    const userCheck = await db.query(
      'SELECT idusuario FROM usuario WHERE idusuario = $1',
      [idUsuario]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    }
    
    // Validar que el tratamiento existe
    const treatmentCheck = await db.query(
      'SELECT idtratamiento FROM tratamiento WHERE idtratamiento = $1',
      [idTratamiento]
    );
    
    if (treatmentCheck.rows.length === 0) {
      return res.status(404).json({ ok: false, msg: "Tratamiento no encontrado" });
    }
    
    // Comenzar transacción
    await db.query('BEGIN');
    
    try {
      // 1. Crear la cita
      const citaQuery = `
        INSERT INTO cita (idtratamiento, horasolicitud, fechasolicitud)
        VALUES ($1, $2, $3)
        RETURNING idcita
      `;
      
      const citaResult = await db.query(citaQuery, [
        idTratamiento,
        horaSolicitud,
        fechaSolicitud
      ]);
      
      const idCita = citaResult.rows[0].idcita;
      
      // 2. Crear el registro usuarioxcita con estadocita = null (pendiente)
      const usuarioCitaQuery = `
        INSERT INTO usuarioxcita (idusuario, idcita, estadocita)
        VALUES ($1, $2, NULL)
        RETURNING idusuariocita, idusuario, idcita, estadocita
      `;
      
      const usuarioCitaResult = await db.query(usuarioCitaQuery, [
        idUsuario,
        idCita
      ]);
      
      // Confirmar transacción
      await db.query('COMMIT');
      
      return res.status(201).json({
        ok: true,
        msg: "Cita solicitada exitosamente",
        data: {
          idcita: idCita,
          idusuariocita: usuarioCitaResult.rows[0].idusuariocita,
          estadocita: null
        }
      });
      
    } catch (error) {
      // Revertir transacción en caso de error
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error("Error crearSolicitudCita:", error);
    return res.status(500).json({ 
      ok: false, 
      msg: "Error al crear la solicitud de cita", 
      detalle: error.message 
    });
  }
};


// ============================
// Obtener citas (opcional filtrado por estado)
// ============================
export const obtenerCitas = async (req, res) => {
  const { estadoCita } = req.query; // true, false o undefined

  try {
    const db = getConnection();

    let query = `
      SELECT 
        uc.idusuariocita,
        uc.idusuario,
        uc.idcita,
        uc.estadocita,
        c.idtratamiento,
        c.horasolicitud,
        c.fechasolicitud,
        t.nombretratamiento,
        t.descripciontratamiento,
        t.preciotratamiento,
        t.imagenurl,
        u.nombre,
        u.apellido,
        u.telefono,
        u.email
      FROM usuarioxcita uc
      INNER JOIN cita c ON uc.idcita = c.idcita
      INNER JOIN tratamiento t ON c.idtratamiento = t.idtratamiento
      INNER JOIN usuario u ON uc.idusuario = u.idusuario
    `;

    const params = [];
    
    if (estadoCita !== undefined && estadoCita !== null) {
      if (estadoCita === 'null' || estadoCita === 'NULL') {
        query += ' WHERE uc.estadocita IS NULL';
      } else {
        query += ' WHERE uc.estadocita = $1';
        params.push(estadoCita === 'true' || estadoCita === true);
      }
    }
    
    query += ' ORDER BY c.fechasolicitud DESC, c.horasolicitud DESC';

    const result = await db.query(query, params);

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

    // SELECT personalizado sin stored procedure
    const query = `
      SELECT 
        uc.idusuariocita,
        c.idcita,
        c.horasolicitud,
        c.fechasolicitud,
        uc.estadocita,
        t.idtratamiento,
        t.nombretratamiento,
        t.descripciontratamiento,
        t.preciotratamiento,
        t.imagenurl,
        tt.nombretipo as categoria
      FROM usuarioxcita uc
      INNER JOIN cita c ON uc.idcita = c.idcita
      INNER JOIN tratamiento t ON c.idtratamiento = t.idtratamiento
      LEFT JOIN tipotratamiento tt ON t.idtipotratamiento = tt.idtipotratamiento
      WHERE uc.idusuario = $1
      ORDER BY c.fechasolicitud DESC, c.horasolicitud DESC
    `;

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

// ============ ADMIN: Gestión de Citas ============

/**
 * Obtener todas las citas pendientes (estadocita = null o false)
 */
export const obtenerCitasPendientes = async (req, res) => {
  try {
    const db = getConnection();

    const query = `
      SELECT 
        uc.idusuariocita,
        uc.idusuario,
        uc.idcita,
        uc.estadocita,
        c.idtratamiento,
        c.horasolicitud,
        c.fechasolicitud,
        t.nombretratamiento,
        t.preciotratamiento,
        u.nombre,
        u.apellido,
        u.telefono
      FROM usuarioxcita uc
      INNER JOIN cita c ON uc.idcita = c.idcita
      INNER JOIN tratamiento t ON c.idtratamiento = t.idtratamiento
      INNER JOIN usuario u ON uc.idusuario = u.idusuario
      WHERE uc.estadocita IS NULL OR uc.estadocita = false
      ORDER BY c.fechasolicitud ASC, c.horasolicitud ASC
    `;

    const result = await db.query(query);

    return res.status(200).json({
      ok: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error obtenerCitasPendientes:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener citas pendientes",
      detalle: error.message
    });
  }
};

/**
 * Aprobar una cita (cambiar estadocita a true)
 */
export const aprobarCita = async (req, res) => {
  try {
    const { idUsuarioCita } = req.params;
    const db = getConnection();

    const query = `
      UPDATE usuarioxcita
      SET estadocita = true
      WHERE idusuariocita = $1
      RETURNING idusuariocita, idusuario, idcita, estadocita
    `;

    const result = await db.query(query, [idUsuarioCita]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Cita no encontrada"
      });
    }

    return res.status(200).json({
      ok: true,
      msg: "Cita aprobada exitosamente",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error aprobarCita:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al aprobar la cita",
      detalle: error.message
    });
  }
};

/**
 * Rechazar/Cancelar una cita (cambiar estadocita a false)
 */
export const rechazarCita = async (req, res) => {
  try {
    const { idUsuarioCita } = req.params;
    const db = getConnection();

    const query = `
      UPDATE usuarioxcita
      SET estadocita = false
      WHERE idusuariocita = $1
      RETURNING idusuariocita, idusuario, idcita, estadocita
    `;

    const result = await db.query(query, [idUsuarioCita]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Cita no encontrada"
      });
    }

    return res.status(200).json({
      ok: true,
      msg: "Cita rechazada",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error rechazarCita:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al rechazar la cita",
      detalle: error.message
    });
  }
};

/**
 * Obtener calendario de citas aprobadas (para vista semanal/mensual)
 */
export const obtenerCalendarioCitas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const db = getConnection();

    let query = `
      SELECT 
        uc.idusuariocita,
        c.idcita,
        c.horasolicitud,
        c.fechasolicitud,
        t.nombretratamiento,
        t.preciotratamiento,
        u.nombre,
        u.apellido,
        u.telefono
      FROM usuarioxcita uc
      INNER JOIN cita c ON uc.idcita = c.idcita
      INNER JOIN tratamiento t ON c.idtratamiento = t.idtratamiento
      INNER JOIN usuario u ON uc.idusuario = u.idusuario
      WHERE uc.estadocita = true
    `;

    const params = [];

    if (fechaInicio && fechaFin) {
      query += ` AND c.fechasolicitud BETWEEN $1 AND $2`;
      params.push(fechaInicio, fechaFin);
    } else if (fechaInicio) {
      query += ` AND c.fechasolicitud >= $1`;
      params.push(fechaInicio);
    } else if (fechaFin) {
      query += ` AND c.fechasolicitud <= $1`;
      params.push(fechaFin);
    }

    query += ` ORDER BY c.fechasolicitud ASC, c.horasolicitud ASC`;

    const result = await db.query(query, params);

    return res.status(200).json({
      ok: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error obtenerCalendarioCitas:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener calendario de citas",
      detalle: error.message
    });
  }
};
