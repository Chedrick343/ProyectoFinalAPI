import { getConnection } from "../config/db.js";

// =============================
// Actualizar cantidad producto
// =============================
export const actualizarCantidad = async (req, res) => {
  const { idCarrito, idProducto, nuevaCantidad } = req.body;

  try {
    console.log("📦 actualizarCantidad - Datos recibidos:", { idCarrito, idProducto, nuevaCantidad });
    
    if (!idCarrito || !idProducto || nuevaCantidad === undefined) {
      return res.status(400).json({ ok: false, msg: "Datos incompletos" });
    }

    if (nuevaCantidad < 1) {
      return res.status(400).json({ ok: false, msg: "La cantidad debe ser mayor a 0" });
    }

    const db = getConnection();

    // El idCarrito que llega es en realidad el userId
    const userId = idCarrito;
    
    // Obtener el carrito del usuario
    const getCarritoQuery = `
      SELECT idcarrito FROM carrito WHERE idusuario = $1
    `;
    console.log("🔍 Buscando carrito para usuario:", userId);
    const carritoResult = await db.query(getCarritoQuery, [userId]);
    
    if (carritoResult.rows.length === 0) {
      console.log("❌ Carrito no encontrado para usuario:", userId);
      return res.status(404).json({ ok: false, msg: "Carrito no encontrado" });
    }
    
    const carritoId = carritoResult.rows[0].idcarrito;
    console.log("✅ Carrito encontrado con ID:", carritoId);

    // Verificar que el producto existe en el carrito
    const checkQuery = `
      SELECT * FROM carritoxproducto 
      WHERE idcarrito = $1 AND idproducto = $2
    `;
    const checkResult = await db.query(checkQuery, [carritoId, idProducto]);

    if (checkResult.rows.length === 0) {
      console.log("❌ Producto no encontrado en el carrito");
      return res.status(404).json({ ok: false, msg: "Producto no encontrado en el carrito" });
    }

    // Actualizar la cantidad
    const updateQuery = `
      UPDATE carritoxproducto 
      SET cantidadproducto = $1 
      WHERE idcarrito = $2 AND idproducto = $3
      RETURNING *
    `;
    const result = await db.query(updateQuery, [nuevaCantidad, carritoId, idProducto]);
    console.log("✅ Cantidad actualizada:", result.rows[0]);

    return res.status(200).json({
      ok: true,
      msg: "Cantidad actualizada",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Error actualizarCantidad:", error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({ ok: false, msg: "Error en servidor", detalle: error.message });
  }
};


// ============================
// Agregar producto al carrito
// ============================
export const agregarACarrito = async (req, res) => {
  const { idCarrito, idProducto, cantidad } = req.body;

  try {
    console.log("📦 agregarACarrito - Datos recibidos:", { idCarrito, idProducto, cantidad });

    if (!idCarrito || !idProducto || !cantidad) {
      console.log("❌ Datos incompletos");
      return res.status(400).json({ ok: false, msg: "Datos incompletos" });
    }

    const db = getConnection();

    // El idCarrito que llega es en realidad el userId
    const userId = idCarrito;
    let carritoId = null;
    
    // Intentar obtener el carrito del usuario
    const getCarritoQuery = `
      SELECT idcarrito FROM carrito WHERE idusuario = $1
    `;
    console.log("🔍 Buscando carrito para usuario:", userId);
    let carritoResult = await db.query(getCarritoQuery, [userId]);
    
    if (carritoResult.rows.length === 0) {
      console.log("➕ Carrito no existe, creando nuevo...");
      // Crear carrito si no existe
      const createCarritoQuery = `
        INSERT INTO carrito (idusuario) 
        VALUES ($1) 
        RETURNING idcarrito
      `;
      carritoResult = await db.query(createCarritoQuery, [userId]);
      carritoId = carritoResult.rows[0].idcarrito;
      console.log("✅ Carrito creado con ID:", carritoId);
    } else {
      carritoId = carritoResult.rows[0].idcarrito;
      console.log("✅ Carrito encontrado con ID:", carritoId);
    }

    // Verificar si el producto ya existe en el carrito
    const checkQuery = `
      SELECT * FROM carritoxproducto 
      WHERE idcarrito = $1 AND idproducto = $2
    `;
    console.log("🔍 Verificando si producto ya existe en carrito...");
    const checkResult = await db.query(checkQuery, [carritoId, idProducto]);

    if (checkResult.rows.length > 0) {
      console.log("📝 Producto existe, actualizando cantidad...");
      // Si ya existe, actualizar cantidad
      const updateQuery = `
        UPDATE carritoxproducto 
        SET cantidadproducto = cantidadproducto + $1 
        WHERE idcarrito = $2 AND idproducto = $3
        RETURNING *
      `;
      const result = await db.query(updateQuery, [cantidad, carritoId, idProducto]);
      console.log("✅ Cantidad actualizada:", result.rows[0]);
      return res.status(200).json({
        ok: true,
        msg: "Cantidad actualizada",
        data: result.rows[0]
      });
    } else {
      console.log("➕ Producto nuevo, insertando...");
      // Si no existe, insertar nuevo
      const insertQuery = `
        INSERT INTO carritoxproducto (idcarrito, idproducto, cantidadproducto)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const result = await db.query(insertQuery, [carritoId, idProducto, cantidad]);
      console.log("✅ Producto agregado:", result.rows[0]);
      return res.status(201).json({
        ok: true,
        msg: "Producto agregado al carrito",
        data: result.rows[0]
      });
    }

  } catch (error) {
    console.error("❌ Error agregarACarrito:", error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({ 
      ok: false, 
      msg: "Error en servidor", 
      detalle: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
    console.log("📦 quitarDeCarrito - Datos recibidos:", { idCarrito, idProducto });
    
    if (!idCarrito || !idProducto) {
      return res.status(400).json({ ok: false, msg: "Datos incompletos" });
    }

    const db = getConnection();

    // El idCarrito que llega es en realidad el userId
    const userId = idCarrito;
    
    // Obtener el carrito del usuario
    const getCarritoQuery = `
      SELECT idcarrito FROM carrito WHERE idusuario = $1
    `;
    console.log("🔍 Buscando carrito para usuario:", userId);
    const carritoResult = await db.query(getCarritoQuery, [userId]);
    
    if (carritoResult.rows.length === 0) {
      console.log("❌ Carrito no encontrado para usuario:", userId);
      return res.status(404).json({ ok: false, msg: "Carrito no encontrado" });
    }
    
    const carritoId = carritoResult.rows[0].idcarrito;
    console.log("✅ Carrito encontrado con ID:", carritoId);

    const query = `
      DELETE FROM carritoxproducto 
      WHERE idcarrito = $1 AND idproducto = $2
      RETURNING *
    `;
    const result = await db.query(query, [carritoId, idProducto]);

    if (result.rows.length === 0) {
      console.log("❌ Producto no encontrado en el carrito");
      return res.status(404).json({ ok: false, msg: "Producto no encontrado en el carrito" });
    }

    console.log("✅ Producto eliminado:", result.rows[0]);
    return res.status(200).json({
      ok: true,
      msg: "Producto eliminado del carrito",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Error quitarDeCarrito:", error);
    console.error("Stack trace:", error.stack);
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



