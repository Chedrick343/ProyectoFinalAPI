import { getConnection } from "../config/db.js";

/**
 * Inicializa la tabla moneda con Colones si está vacía
 */
export const initializeMonedas = async () => {
  try {
    const db = getConnection();

    // Verificar si hay monedas en la tabla
    const checkQuery = `SELECT COUNT(*) as count FROM moneda`;
    const result = await db.query(checkQuery);
    const count = parseInt(result.rows[0].count);

    if (count === 0) {
      console.log("[MONEDA] Tabla vacía, insertando Colones por defecto...");

      // Insertar Colones como moneda por defecto
      const insertQuery = `
        INSERT INTO moneda (nombremoneda, simbolo)
        VALUES ('Colones', '₡')
        RETURNING idmoneda, nombremoneda, simbolo
      `;

      const insertResult = await db.query(insertQuery);
      console.log("[MONEDA] Colones insertados:", insertResult.rows[0]);
    } else {
      console.log(`[MONEDA] Tabla ya contiene ${count} moneda(s), no se requiere inicialización`);
    }
  } catch (error) {
    console.error("[MONEDA] Error al inicializar monedas:", error);
    throw error;
  }
};

/**
 * Obtiene el ID de la moneda Colones (moneda por defecto)
 */
export const getColonesId = async () => {
  try {
    const db = getConnection();

    const query = `
      SELECT idmoneda 
      FROM moneda 
      WHERE nombremoneda = 'Colones'
      LIMIT 1
    `;

    const result = await db.query(query);

    if (result.rows.length === 0) {
      throw new Error("Moneda Colones no encontrada en la base de datos");
    }

    return result.rows[0].idmoneda;
  } catch (error) {
    console.error("[MONEDA] Error al obtener ID de Colones:", error);
    throw error;
  }
};
