import { Router, RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { pool } from "../config/database";
import { productSchema, validateRequest } from "../middleware/validation";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify seller token
const authSeller: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== "seller") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized as seller" });
    }

    (req as any).sellerId = decoded.sellerId;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// Create Product
router.post("/add", authSeller, validateRequest(productSchema), (async (
  req,
  res,
) => {
  try {
    const { name, description, price, stock } = req.body;
    const sellerId = (req as any).sellerId;

    const connection = await pool.getConnection();

    try {
      const productId = uuidv4();

      await connection.execute(
        "INSERT INTO products (id, seller_id, name, description, price, stock) VALUES (?, ?, ?, ?, ?, ?)",
        [productId, sellerId, name, description, price, stock],
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

// Get Seller's Products
router.get("/my-products", authSeller, (async (req, res) => {
  try {
    const sellerId = (req as any).sellerId;
    const connection = await pool.getConnection();

    try {
      const [products] = await connection.execute(
        "SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC",
        [sellerId],
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

// Get All Products (Public)
router.get("/all", (async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [products] = await connection.execute(
        `SELECT p.*, s.shop_name FROM products p 
           LEFT JOIN sellers s ON p.seller_id = s.id 
           ORDER BY p.created_at DESC`,
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

// Get Product by ID
router.get("/:id", (async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
      const [products] = await connection.execute(
        `SELECT p.*, s.shop_name FROM products p 
           LEFT JOIN sellers s ON p.seller_id = s.id 
           WHERE p.id = ?`,
        [id],
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

// Update Product Stock
router.put("/:id/stock", authSeller, (async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const sellerId = (req as any).sellerId;

    // Validate stock
    if (!Number.isInteger(stock) || stock < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid stock value" });
    }

    const connection = await pool.getConnection();

    try {
      // Verify seller owns the product
      const [products] = await connection.execute(
        "SELECT * FROM products WHERE id = ? AND seller_id = ?",
        [id, sellerId],
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

// Delete Product
router.delete("/:id", authSeller, (async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = (req as any).sellerId;

    const connection = await pool.getConnection();

    try {
      // Verify seller owns the product
      const [products] = await connection.execute(
        "SELECT * FROM products WHERE id = ? AND seller_id = ?",
        [id, sellerId],
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
