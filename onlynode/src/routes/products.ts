import { Router, RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../config/database";
import { productSchema, validateRequest } from "../middleware/validation";

const router = Router();

router.post("/add", validateRequest(productSchema), (async (req, res) => {
  try {
    const { name, description, price, stock, seller_id } = req.body;

    if (!seller_id) {
      return res
        .status(400)
        .json({ success: false, message: "seller_id is required" });
    }

    const connection = await pool.getConnection();

    try {
      const [sellers] = await connection.execute(
        "SELECT id FROM sellers WHERE id = ?",
        [seller_id]
      );

      if ((sellers as any[]).length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid seller_id. Seller does not exist." });
      }

      const productId = uuidv4();

      await connection.execute(
        "INSERT INTO products (id, seller_id, name, description, price, stock) VALUES (?, ?, ?, ?, ?, ?)",
        [productId, seller_id, name, description, price, stock]
      );

      res.status(201).json({
        success: true,
        message: "Product added successfully",
        product: {
          id: productId,
          name,
          description,
          price,
          stock,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ success: false, message: "Failed to add product" });
  }
}) as RequestHandler);

router.get("/my-products", (async (req, res) => {
  try {
    const sellerId = req.query.seller_id;

    if (!sellerId) {
      return res
        .status(400)
        .json({ success: false, message: "seller_id is required" });
    }

    const connection = await pool.getConnection();

    try {
      const [products] = await connection.execute(
        "SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC",
        [sellerId]
      );

      res.json({
        success: true,
        products: products as any[],
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch products" });
  }
}) as RequestHandler);

router.get("/all", (async (_req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [products] = await connection.execute(
        `SELECT p.*, s.shop_name FROM products p 
         LEFT JOIN sellers s ON p.seller_id = s.id 
         ORDER BY p.created_at DESC`
      );

      res.json({
        success: true,
        products: products as any[],
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch products" });
  }
}) as RequestHandler);

router.get("/:id", (async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
      const [products] = await connection.execute(
        `SELECT p.*, s.shop_name FROM products p 
         LEFT JOIN sellers s ON p.seller_id = s.id 
         WHERE p.id = ?`,
        [id]
      );

      const product = (products as any[])[0];

      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      res.json({
        success: true,
        product,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch product" });
  }
}) as RequestHandler);

router.put("/:id/stock", (async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, seller_id } = req.body;

    if (!seller_id) {
      return res
        .status(400)
        .json({ success: false, message: "seller_id is required" });
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid stock value" });
    }

    const connection = await pool.getConnection();

    try {
      const [products] = await connection.execute(
        "SELECT * FROM products WHERE id = ? AND seller_id = ?",
        [id, seller_id]
      );

      if ((products as any[]).length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      await connection.execute("UPDATE products SET stock = ? WHERE id = ?", [
        stock,
        id,
      ]);

      res.json({
        success: true,
        message: "Stock updated successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ success: false, message: "Failed to update stock" });
  }
}) as RequestHandler);

router.delete("/:id", (async (req, res) => {
  try {
    const { id } = req.params;
    const { seller_id } = req.body;

    if (!seller_id) {
      return res
        .status(400)
        .json({ success: false, message: "seller_id is required" });
    }

    const connection = await pool.getConnection();

    try {
      const [products] = await connection.execute(
        "SELECT * FROM products WHERE id = ? AND seller_id = ?",
        [id, seller_id]
      );

      if ((products as any[]).length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      await connection.execute("DELETE FROM products WHERE id = ?", [id]);

      res.json({
        success: true,
        message: "Product deleted successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete product" });
  }
}) as RequestHandler);

export default router;
