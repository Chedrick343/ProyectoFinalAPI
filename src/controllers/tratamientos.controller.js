import { getConnection } from "../config/db.js";

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

