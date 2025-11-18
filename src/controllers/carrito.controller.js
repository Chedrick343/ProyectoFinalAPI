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

    const query = "SELECT * FROM sp_actualizarCantidad($1, $2, $3);";
    const result = await db.query(query, [idCarrito, idProducto, nuevaCantidad]);

    return res.status(200).json({
      ok: true,
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

    const query = "SELECT * FROM sp_agregarACarrito($1, $2, $3);";
    const result = await db.query(query, [idCarrito, idProducto, cantidad]);

    return res.status(201).json({
      ok: true,
      data: result.rows[0]
    });

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

    const query = "SELECT * FROM sp_obtenerCarritoUsuario($1);";
    const result = await db.query(query, [idUsuario]);

    return res.status(200).json({
      ok: true,
      data: result.rows  // devuelve lista
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

    const query = "SELECT * FROM sp_quitarDeCarrito($1, $2);";
    const result = await db.query(query, [idCarrito, idProducto]);

    return res.status(200).json({
      ok: true,
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

    const query = "SELECT * FROM sp_vaciarCarrito($1);";
    const result = await db.query(query, [idCarrito]);

    return res.status(200).json({
      ok: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error vaciarCarrito:", error);
    return res.status(500).json({ ok: false, msg: "Error en servidor", detalle: error.message });
  }
};
