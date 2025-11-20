import { getConnection } from "../config/db.js";

/**
 * Obtiene todos los productos
 */
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

/**
 * Obtiene el detalle completo de un producto específico
 */
export const obtenerDetalleProducto = async (req, res) => {
  try {
    const { idProducto } = req.params;
    const db = getConnection();

    const query = `
      SELECT 
        idproducto,
        nombreproducto,
        descripcionproducto,
        precioproducto,
        cantidadstock,
        imagenurl
      FROM producto
      WHERE idproducto = $1
    `;

    const result = await db.query(query, [idProducto]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Producto no encontrado"
      });
    }

    return res.status(200).json({
      ok: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error obtenerDetalleProducto:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener detalle del producto",
      detalle: error.message
    });
  }
};

// ============ ADMIN: Gestión de Productos ============

/**
 * Crear un nuevo producto
 */
export const crearProducto = async (req, res) => {
  try {
    const { nombreProducto, descripcionProducto, precioProducto, cantidadStock, imagenUrl } = req.body;
    const db = getConnection();

    // Validaciones
    if (!nombreProducto || nombreProducto.trim() === '') {
      return res.status(400).json({
        ok: false,
        msg: "El nombre del producto es requerido"
      });
    }

    if (!precioProducto || precioProducto <= 0) {
      return res.status(400).json({
        ok: false,
        msg: "El precio debe ser mayor a 0"
      });
    }

    if (cantidadStock === undefined || cantidadStock < 0) {
      return res.status(400).json({
        ok: false,
        msg: "La cantidad en stock debe ser 0 o mayor"
      });
    }

    const query = `
      INSERT INTO producto (nombreproducto, descripcionproducto, precioproducto, cantidadstock, imagenurl)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING idproducto, nombreproducto, descripcionproducto, precioproducto, cantidadstock, imagenurl
    `;

    const result = await db.query(query, [
      nombreProducto.trim(),
      descripcionProducto?.trim() || null,
      precioProducto,
      cantidadStock,
      imagenUrl?.trim() || null
    ]);

    return res.status(201).json({
      ok: true,
      msg: "Producto creado exitosamente",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error crearProducto:", error);
    if (error.code === '23505') {
      return res.status(409).json({
        ok: false,
        msg: "Ya existe un producto con ese nombre"
      });
    }
    return res.status(500).json({
      ok: false,
      msg: "Error al crear el producto",
      detalle: error.message
    });
  }
};

/**
 * Actualizar un producto existente
 */
export const actualizarProducto = async (req, res) => {
  try {
    const { idProducto } = req.params;
    const { nombreProducto, descripcionProducto, precioProducto, cantidadStock, imagenUrl } = req.body;
    const db = getConnection();

    if (!nombreProducto || nombreProducto.trim() === '') {
      return res.status(400).json({
        ok: false,
        msg: "El nombre del producto es requerido"
      });
    }

    if (!precioProducto || precioProducto <= 0) {
      return res.status(400).json({
        ok: false,
        msg: "El precio debe ser mayor a 0"
      });
    }

    if (cantidadStock === undefined || cantidadStock < 0) {
      return res.status(400).json({
        ok: false,
        msg: "La cantidad en stock debe ser 0 o mayor"
      });
    }

    const query = `
      UPDATE producto
      SET nombreproducto = $1,
          descripcionproducto = $2,
          precioproducto = $3,
          cantidadstock = $4,
          imagenurl = $5
      WHERE idproducto = $6
      RETURNING idproducto, nombreproducto, descripcionproducto, precioproducto, cantidadstock, imagenurl
    `;

    const result = await db.query(query, [
      nombreProducto.trim(),
      descripcionProducto?.trim() || null,
      precioProducto,
      cantidadStock,
      imagenUrl?.trim() || null,
      idProducto
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Producto no encontrado"
      });
    }

    return res.status(200).json({
      ok: true,
      msg: "Producto actualizado exitosamente",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error actualizarProducto:", error);
    if (error.code === '23505') {
      return res.status(409).json({
        ok: false,
        msg: "Ya existe un producto con ese nombre"
      });
    }
    return res.status(500).json({
      ok: false,
      msg: "Error al actualizar el producto",
      detalle: error.message
    });
  }
};

/**
 * Eliminar un producto
 */
export const eliminarProducto = async (req, res) => {
  try {
    const { idProducto } = req.params;
    const db = getConnection();

    const deleteQuery = `
      DELETE FROM producto
      WHERE idproducto = $1
      RETURNING idproducto, nombreproducto
    `;

    const result = await db.query(deleteQuery, [idProducto]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Producto no encontrado"
      });
    }

    return res.status(200).json({
      ok: true,
      msg: "Producto eliminado exitosamente",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error eliminarProducto:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al eliminar el producto",
      detalle: error.message
    });
  }
};
