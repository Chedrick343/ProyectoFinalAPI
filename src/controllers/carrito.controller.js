import { getConnection } from "../config/db.js";

// =============================
// Actualizar cantidad producto
// =============================
export const actualizarCantidad = async (req, res) => {
  const { idCarrito, idProducto, nuevaCantidad } = req.body;

  try {
    if (!idCarrito || !idProducto || nuevaCantidad === undefined) {
      return res.status(400).json({ ok: false, msg: "Datos incompletos" });
    }

    const db = getConnection();

    // Verificar que el producto existe en el carrito
    const checkQuery = `
      SELECT * FROM carritoxproducto 
      WHERE idcarrito = $1 AND idproducto = $2
    `;
    const checkResult = await db.query(checkQuery, [idCarrito, idProducto]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ ok: false, msg: "Producto no encontrado en el carrito" });
    }

    // Actualizar la cantidad
    const updateQuery = `
      UPDATE carritoxproducto 
      SET cantidadproducto = $1 
      WHERE idcarrito = $2 AND idproducto = $3
      RETURNING *
    `;
    const result = await db.query(updateQuery, [nuevaCantidad, idCarrito, idProducto]);

    return res.status(200).json({
      ok: true,
      msg: "Cantidad actualizada",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error actualizarCantidad:", error);
    return res.status(500).json({ ok: false, msg: "Error en servidor", detalle: error.message });
  }
};


// ============================
// Agregar producto al carrito
// ============================
export const agregarACarrito = async (req, res) => {
  const { idCarrito, idProducto, cantidad } = req.body;

  try {
    if (!idCarrito || !idProducto || !cantidad) {
      return res.status(400).json({ ok: false, msg: "Datos incompletos" });
    }

    const db = getConnection();

    // Primero verificar/crear el carrito del usuario
    // El idCarrito que llega puede ser el userId
    let carritoId = idCarrito;
    
    // Intentar obtener el carrito
    const getCarritoQuery = `
      SELECT idcarrito FROM carrito WHERE idusuario = $1
    `;
    let carritoResult = await db.query(getCarritoQuery, [idCarrito]);
    
    if (carritoResult.rows.length === 0) {
      // Crear carrito si no existe
      const createCarritoQuery = `
        INSERT INTO carrito (idusuario) 
        VALUES ($1) 
        RETURNING idcarrito
      `;
      carritoResult = await db.query(createCarritoQuery, [idCarrito]);
      carritoId = carritoResult.rows[0].idcarrito;
    } else {
      carritoId = carritoResult.rows[0].idcarrito;
    }

    // Verificar si el producto ya existe en el carrito
    const checkQuery = `
      SELECT * FROM carritoxproducto 
      WHERE idcarrito = $1 AND idproducto = $2
    `;
    const checkResult = await db.query(checkQuery, [carritoId, idProducto]);

    if (checkResult.rows.length > 0) {
      // Si ya existe, actualizar cantidad
      const updateQuery = `
        UPDATE carritoxproducto 
        SET cantidadproducto = cantidadproducto + $1 
        WHERE idcarrito = $2 AND idproducto = $3
        RETURNING *
      `;
      const result = await db.query(updateQuery, [cantidad, carritoId, idProducto]);
      return res.status(200).json({
        ok: true,
        msg: "Cantidad actualizada",
        data: result.rows[0]
      });
    } else {
      // Si no existe, insertar nuevo
      const insertQuery = `
        INSERT INTO carritoxproducto (idcarrito, idproducto, cantidadproducto)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const result = await db.query(insertQuery, [carritoId, idProducto, cantidad]);
      return res.status(201).json({
        ok: true,
        msg: "Producto agregado al carrito",
        data: result.rows[0]
      });
    }

  } catch (error) {
    console.error("Error agregarACarrito:", error);
    return res.status(500).json({ ok: false, msg: "Error en servidor", detalle: error.message });
  }
};


// =======================================
// Obtener carrito del usuario
// =======================================
export const obtenerCarritoUsuario = async (req, res) => {
  const { idUsuario } = req.params;

  try {
    if (!idUsuario) {
      return res.status(400).json({ ok: false, msg: "El idUsuario es obligatorio" });
    }

    const db = getConnection();

    // Primero obtener o crear el carrito del usuario
    let carritoQuery = `
      SELECT idcarrito FROM carrito WHERE idusuario = $1
    `;
    let carritoResult = await db.query(carritoQuery, [idUsuario]);

    if (carritoResult.rows.length === 0) {
      // Crear carrito si no existe
      const createCarritoQuery = `
        INSERT INTO carrito (idusuario) 
        VALUES ($1) 
        RETURNING idcarrito
      `;
      carritoResult = await db.query(createCarritoQuery, [idUsuario]);
    }

    const idCarrito = carritoResult.rows[0].idcarrito;

    // Obtener productos del carrito con JOIN
    const query = `
      SELECT 
        p.idproducto,
        p.nombreproducto,
        p.descripcionproducto,
        p.precioproducto,
        p.cantidadstock,
        p.imagenurl,
        cp.cantidadproducto,
        cp.idcarritoxproducto
      FROM carritoxproducto cp
      INNER JOIN producto p ON cp.idproducto = p.idproducto
      WHERE cp.idcarrito = $1
      ORDER BY cp.idcarritoxproducto DESC
    `;
    const result = await db.query(query, [idCarrito]);

    return res.status(200).json({
      ok: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Error obtenerCarritoUsuario:", error);
    return res.status(500).json({ ok: false, msg: "Error en servidor", detalle: error.message });
  }
};


// =========================
// Quitar producto del carrito
// =========================
export const quitarDeCarrito = async (req, res) => {
  const { idCarrito, idProducto } = req.body;

  try {
    if (!idCarrito || !idProducto) {
      return res.status(400).json({ ok: false, msg: "Datos incompletos" });
    }

    const db = getConnection();

    const query = `
      DELETE FROM carritoxproducto 
      WHERE idcarrito = $1 AND idproducto = $2
      RETURNING *
    `;
    const result = await db.query(query, [idCarrito, idProducto]);

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, msg: "Producto no encontrado en el carrito" });
    }

    return res.status(200).json({
      ok: true,
      msg: "Producto eliminado del carrito",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error quitarDeCarrito:", error);
    return res.status(500).json({ ok: false, msg: "Error en servidor", detalle: error.message });
  }
};


// =========================
// Vaciar carrito
// =========================
export const vaciarCarrito = async (req, res) => {
  const { idCarrito } = req.body;

  try {
    if (!idCarrito) {
      return res.status(400).json({ ok: false, msg: "El idCarrito es obligatorio" });
    }

    const db = getConnection();

    const query = `
      DELETE FROM carritoxproducto 
      WHERE idcarrito = $1
      RETURNING *
    `;
    const result = await db.query(query, [idCarrito]);

    return res.status(200).json({
      ok: true,
      msg: "Carrito vaciado",
      data: { itemsEliminados: result.rowCount }
    });

  } catch (error) {
    console.error("Error vaciarCarrito:", error);
    return res.status(500).json({ ok: false, msg: "Error en servidor", detalle: error.message });
  }
};



