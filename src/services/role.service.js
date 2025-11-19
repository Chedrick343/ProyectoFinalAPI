import { getConnection } from "../config/db.js";

/**
 * Inicializa los roles en la base de datos si no existen
 * Crea los roles "Cliente" y "Administrador"
 */
export const initializeRoles = async () => {
    try {
        const db = getConnection();

        // Verificar si ya existen roles
        const checkQuery = "SELECT COUNT(*) as count FROM rolusuario;";
        const checkResult = await db.query(checkQuery);
        const roleCount = parseInt(checkResult.rows[0].count);

        if (roleCount === 0) {
            console.log("[ROLES] No se encontraron roles, inicializando...");

            // Insertar roles por defecto
            const insertQuery = `
        INSERT INTO rolusuario (nombrerol) 
        VALUES ('Cliente'), ('Administrador')
        RETURNING *;
      `;
            const insertResult = await db.query(insertQuery);

            console.log("[ROLES] Roles creados exitosamente:", insertResult.rows);
            return true;
        } else {
            console.log(`[ROLES] Ya existen ${roleCount} roles en la base de datos`);
            return false;
        }
    } catch (error) {
        console.error("[ROLES] Error al inicializar roles:", error);
        throw error;
    }
};

/**
 * Obtiene el ID del rol por nombre
 * @param {string} nombreRol - Nombre del rol ("Cliente" o "Administrador")
 * @returns {Promise<string>} ID del rol (uuid)
 */
export const getRoleIdByName = async (nombreRol) => {
    try {
        const db = getConnection();
        const query = "SELECT idrol FROM rolusuario WHERE nombrerol = $1;";
        const result = await db.query(query, [nombreRol]);

        if (result.rows.length === 0) {
            throw new Error(`Rol "${nombreRol}" no encontrado`);
        }

        return result.rows[0].idrol;
    } catch (error) {
        console.error(`[ROLES] Error al obtener ID del rol "${nombreRol}":`, error);
        throw error;
    }
};

/**
 * Verifica si es el primer usuario en la base de datos
 * @returns {Promise<boolean>} true si es el primer usuario, false en caso contrario
 */
export const isFirstUser = async () => {
    try {
        const db = getConnection();
        const query = "SELECT COUNT(*) as count FROM usuario;";
        const result = await db.query(query);
        const userCount = parseInt(result.rows[0].count);

        return userCount === 0;
    } catch (error) {
        console.error("[ROLES] Error al verificar primer usuario:", error);
        throw error;
    }
};

/**
 * Obtiene todos los roles disponibles
 * @returns {Promise<Array>} Lista de roles
 */
export const getAllRoles = async () => {
    try {
        const db = getConnection();
        const query = "SELECT * FROM rolusuario ORDER BY nombrerol;";
        const result = await db.query(query);

        return result.rows;
    } catch (error) {
        console.error("[ROLES] Error al obtener roles:", error);
        throw error;
    }
};
