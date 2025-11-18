import { getConnection } from "../config/db.js";

export const obtenerProductos = async (req, res) => {
  try {
    const db = getConnection();

    // Ejecuta función PostgreSQL
    const query = "SELECT * FROM sp_obtenerProductos();";
    const result = await db.query(query);

    return res.status(200).json({
      ok: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error obtenerProductos:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener los productos",
      detalle: error.message
    });
  }
};
