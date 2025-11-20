import { getConnection } from "../config/db.js";

/**
 * Obtiene todos los tratamientos con su tipo
 */
export const obtenerTratamientos = async (req, res) => {
  try {
    const db = getConnection();

    // Llamamos la función de PostgreSQL que retorna tratamiento + tipo
    const query = "SELECT * FROM sp_obtenerTratamientosConTipo();";
    const result = await db.query(query);

    return res.status(200).json({
      ok: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error obtenerTratamientos:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener los tratamientos",
      detalle: error.message
    });
  }
};

/**
 * Obtiene todos los tipos de tratamiento (categorías)
 */
export const obtenerTiposTratamiento = async (req, res) => {
  try {
    const db = getConnection();

    const query = `
      SELECT 
        idtipotratamiento,
        nombretipo,
        (SELECT COUNT(*) FROM tratamiento t WHERE t.idtipotratamiento = tt.idtipotratamiento) as cantidad_tratamientos
      FROM tipotratamiento tt
      ORDER BY nombretipo ASC
    `;

    const result = await db.query(query);

    return res.status(200).json({
      ok: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error obtenerTiposTratamiento:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener los tipos de tratamiento",
      detalle: error.message
    });
  }
};

/**
 * Obtiene tratamientos filtrados por tipo/categoría
 */
export const obtenerTratamientosPorTipo = async (req, res) => {
  try {
    const { idTipo } = req.params;
    const db = getConnection();

    const query = `
      SELECT 
        t.idtratamiento,
        t.nombretratamiento,
        t.descripciontratamiento,
        t.preciotratamiento,
        t.imagenurl,
        t.idtipotratamiento,
        tt.nombretipo
      FROM tratamiento t
      INNER JOIN tipotratamiento tt ON t.idtipotratamiento = tt.idtipotratamiento
      WHERE t.idtipotratamiento = $1
      ORDER BY t.nombretratamiento ASC
    `;

    const result = await db.query(query, [idTipo]);

    return res.status(200).json({
      ok: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error obtenerTratamientosPorTipo:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener tratamientos por tipo",
      detalle: error.message
    });
  }
};

/**
 * Obtiene el detalle completo de un tratamiento específico
 */
export const obtenerDetalleTratamiento = async (req, res) => {
  try {
    const { idTratamiento } = req.params;
    const db = getConnection();

    const query = `
      SELECT 
        t.idtratamiento,
        t.nombretratamiento,
        t.descripciontratamiento,
        t.preciotratamiento,
        t.imagenurl,
        t.idtipotratamiento,
        tt.nombretipo
      FROM tratamiento t
      INNER JOIN tipotratamiento tt ON t.idtipotratamiento = tt.idtipotratamiento
      WHERE t.idtratamiento = $1
    `;

    const result = await db.query(query, [idTratamiento]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Tratamiento no encontrado"
      });
    }

    return res.status(200).json({
      ok: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error obtenerDetalleTratamiento:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener detalle del tratamiento",
      detalle: error.message
    });
  }
};

// ============ ADMIN: Gestión de Categorías ============

/**
 * Crear una nueva categoría de tratamiento
 */
export const crearCategoria = async (req, res) => {
  try {
    console.log("[crearCategoria] Body recibido:", JSON.stringify(req.body));
    const { nombreTipo } = req.body;
    console.log("[crearCategoria] nombreTipo extraído:", nombreTipo);
    const db = getConnection();

    if (!nombreTipo || nombreTipo.trim() === '') {
      console.log("[crearCategoria] Validación falló: nombreTipo vacío o undefined");
      return res.status(400).json({
        ok: false,
        msg: "El nombre de la categoría es requerido"
      });
    }
    
    console.log("[crearCategoria] Intentando insertar:", nombreTipo.trim());

    const insertQuery = `
      INSERT INTO tipotratamiento (nombretipo)
      VALUES ($1)
      RETURNING idtipotratamiento, nombretipo
    `;

    const result = await db.query(insertQuery, [
      nombreTipo.trim()]);

    console.log("[crearCategoria] Resultado exitoso:", JSON.stringify(result.rows[0]));
    
    return res.status(201).json({
      ok: true,
      msg: "Categoría creada exitosamente",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("[crearCategoria] ERROR CAPTURADO:", error);
    console.error("[crearCategoria] Error message:", error.message);
    console.error("[crearCategoria] Error code:", error.code);
    console.error("[crearCategoria] Error detail:", error.detail);
    console.error("[crearCategoria] Stack trace:", error.stack);

    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        ok: false,
        msg: "Ya existe una categoría con ese nombre"
      });
    }

    return res.status(500).json({
      ok: false,
      msg: "Error al crear la categoría",
      error: error.message,
      code: error.code,
      detalle: error.toString()
    });
  }
};

/**
 * Actualizar una categoría existente
 */
export const actualizarCategoria = async (req, res) => {
  try {
    const { idCategoria } = req.params;
    const { nombreTipo } = req.body;
    const db = getConnection();

    if (!nombreTipo || nombreTipo.trim() === '') {
      return res.status(400).json({
        ok: false,
        msg: "El nombre de la categoría es requerido"
      });
    }

    const query = `
      UPDATE tipotratamiento
      SET nombretipo = $1
      WHERE idtipotratamiento = $2
      RETURNING idtipotratamiento, nombretipo
    `;

    const result = await db.query(query, [nombreTipo.trim(), idCategoria]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Categoría no encontrada"
      });
    }

    return res.status(200).json({
      ok: true,
      msg: "Categoría actualizada exitosamente",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error actualizarCategoria:", error);
    if (error.code === '23505') {
      return res.status(409).json({
        ok: false,
        msg: "Ya existe una categoría con ese nombre"
      });
    }
    return res.status(500).json({
      ok: false,
      msg: "Error al actualizar la categoría",
      detalle: error.message
    });
  }
};

/**
 * Eliminar una categoría
 */
export const eliminarCategoria = async (req, res) => {
  try {
    const { idCategoria } = req.params;
    const db = getConnection();

    // Verificar si tiene tratamientos asociados
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM tratamiento
      WHERE idtipotratamiento = $1
    `;
    const checkResult = await db.query(checkQuery, [idCategoria]);

    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(409).json({
        ok: false,
        msg: "No se puede eliminar la categoría porque tiene tratamientos asociados"
      });
    }

    const deleteQuery = `
      DELETE FROM tipotratamiento
      WHERE idtipotratamiento = $1
      RETURNING idtipotratamiento, nombretipo
    `;

    const result = await db.query(deleteQuery, [idCategoria]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Categoría no encontrada"
      });
    }

    return res.status(200).json({
      ok: true,
      msg: "Categoría eliminada exitosamente",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error eliminarCategoria:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al eliminar la categoría",
      detalle: error.message
    });
  }
};

// ============ ADMIN: Gestión de Tratamientos ============

/**
 * Crear un nuevo tratamiento
 */
export const crearTratamiento = async (req, res) => {
  try {
    const { nombreTratamiento, descripcionTratamiento, precioTratamiento, imagenUrl, idTipoTratamiento } = req.body;
    const db = getConnection();

    // Validaciones
    if (!nombreTratamiento || nombreTratamiento.trim() === '') {
      return res.status(400).json({
        ok: false,
        msg: "El nombre del tratamiento es requerido"
      });
    }

    if (!precioTratamiento || precioTratamiento <= 0) {
      return res.status(400).json({
        ok: false,
        msg: "El precio debe ser mayor a 0"
      });
    }

    if (!idTipoTratamiento) {
      return res.status(400).json({
        ok: false,
        msg: "La categoría es requerida"
      });
    }

    const query = `
      INSERT INTO tratamiento (nombretratamiento, descripciontratamiento, preciotratamiento, imagenurl, idtipotratamiento)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING idtratamiento, nombretratamiento, descripciontratamiento, preciotratamiento, imagenurl, idtipotratamiento
    `;

    const result = await db.query(query, [
      nombreTratamiento.trim(),
      descripcionTratamiento?.trim() || null,
      precioTratamiento,
      imagenUrl?.trim() || null,
      idTipoTratamiento
    ]);

    return res.status(201).json({
      ok: true,
      msg: "Tratamiento creado exitosamente",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error crearTratamiento:", error);
    if (error.code === '23505') {
      return res.status(409).json({
        ok: false,
        msg: "Ya existe un tratamiento con ese nombre"
      });
    }
    if (error.code === '23503') {
      return res.status(400).json({
        ok: false,
        msg: "La categoría seleccionada no existe"
      });
    }
    return res.status(500).json({
      ok: false,
      msg: "Error al crear el tratamiento",
      detalle: error.message
    });
  }
};

/**
 * Actualizar un tratamiento existente
 */
export const actualizarTratamiento = async (req, res) => {
  try {
    const { idTratamiento } = req.params;
    const { nombreTratamiento, descripcionTratamiento, precioTratamiento, imagenUrl, idTipoTratamiento } = req.body;
    const db = getConnection();

    if (!nombreTratamiento || nombreTratamiento.trim() === '') {
      return res.status(400).json({
        ok: false,
        msg: "El nombre del tratamiento es requerido"
      });
    }

    if (!precioTratamiento || precioTratamiento <= 0) {
      return res.status(400).json({
        ok: false,
        msg: "El precio debe ser mayor a 0"
      });
    }

    if (!idTipoTratamiento) {
      return res.status(400).json({
        ok: false,
        msg: "La categoría es requerida"
      });
    }

    const query = `
      UPDATE tratamiento
      SET nombretratamiento = $1,
          descripciontratamiento = $2,
          preciotratamiento = $3,
          imagenurl = $4,
          idtipotratamiento = $5
      WHERE idtratamiento = $6
      RETURNING idtratamiento, nombretratamiento, descripciontratamiento, preciotratamiento, imagenurl, idtipotratamiento
    `;

    const result = await db.query(query, [
      nombreTratamiento.trim(),
      descripcionTratamiento?.trim() || null,
      precioTratamiento,
      imagenUrl?.trim() || null,
      idTipoTratamiento,
      idTratamiento
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Tratamiento no encontrado"
      });
    }

    return res.status(200).json({
      ok: true,
      msg: "Tratamiento actualizado exitosamente",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error actualizarTratamiento:", error);
    if (error.code === '23505') {
      return res.status(409).json({
        ok: false,
        msg: "Ya existe un tratamiento con ese nombre"
      });
    }
    if (error.code === '23503') {
      return res.status(400).json({
        ok: false,
        msg: "La categoría seleccionada no existe"
      });
    }
    return res.status(500).json({
      ok: false,
      msg: "Error al actualizar el tratamiento",
      detalle: error.message
    });
  }
};

/**
 * Eliminar un tratamiento
 */
export const eliminarTratamiento = async (req, res) => {
  try {
    const { idTratamiento } = req.params;
    const db = getConnection();

    const deleteQuery = `
      DELETE FROM tratamiento
      WHERE idtratamiento = $1
      RETURNING idtratamiento, nombretratamiento
    `;

    const result = await db.query(deleteQuery, [idTratamiento]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Tratamiento no encontrado"
      });
    }

    return res.status(200).json({
      ok: true,
      msg: "Tratamiento eliminado exitosamente",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error eliminarTratamiento:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al eliminar el tratamiento",
      detalle: error.message
    });
  }
};

