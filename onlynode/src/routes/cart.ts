import { Router, RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../config/database";
import {
  cartItemSchema,
  updateCartItemSchema,
  validateRequest,
} from "../middleware/validation";

const router = Router();

router.post("/add", validateRequest(cartItemSchema), (async (req, res) => {
  try {
    const { product_id, quantity, user_id } = req.body;

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "user_id is required" });
    }

    const connection = await pool.getConnection();

    try {
      const [products] = await connection.execute(
        "SELECT * FROM products WHERE id = ?",
        [product_id]
      );

      if ((products as any[]).length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      const [existingCart] = await connection.execute(
        "SELECT * FROM cart WHERE user_id = ? AND product_id = ?",
        [user_id, product_id]
      );

      if ((existingCart as any[]).length > 0) {
        const cartItem = (existingCart as any[])[0];
        await connection.execute(
          "UPDATE cart SET quantity = quantity + ? WHERE id = ?",
          [quantity, cartItem.id]
        );
      } else {
        const cartId = uuidv4();
        await connection.execute(
          "INSERT INTO cart (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)",
          [cartId, user_id, product_id, quantity]
        );
      }

      res.status(201).json({
        success: true,
        message: "Item added to cart",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to add item to cart" });
  }
}) as RequestHandler);

router.get("/items", (async (req, res) => {
  try {
    const user_id = req.query.user_id;

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "user_id is required" });
    }

    const connection = await pool.getConnection();

    try {
      const [cartItems] = await connection.execute(
        `SELECT c.*, p.name, p.price, p.stock FROM cart c
         JOIN products p ON c.product_id = p.id
         WHERE c.user_id = ?
         ORDER BY c.created_at DESC`,
        [user_id]
      );

      res.json({
        success: true,
        items: cartItems as any[],
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ success: false, message: "Failed to fetch cart" });
  }
}) as RequestHandler);

router.put("/:cartId", validateRequest(updateCartItemSchema), (async (
  req,
  res
) => {
  try {
    const { cartId } = req.params;
    const { quantity, user_id } = req.body;

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "user_id is required" });
    }

    const connection = await pool.getConnection();

    try {
      const [cartItems] = await connection.execute(
        "SELECT * FROM cart WHERE id = ? AND user_id = ?",
        [cartId, user_id]
      );

      if ((cartItems as any[]).length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Cart item not found" });
      }

      await connection.execute("UPDATE cart SET quantity = ? WHERE id = ?", [
        quantity,
        cartId,
      ]);

      res.json({
        success: true,
        message: "Cart updated successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ success: false, message: "Failed to update cart" });
  }
}) as RequestHandler);

router.delete("/:cartId", (async (req, res) => {
  try {
    const { cartId } = req.params;
    const user_id = req.query.user_id;

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "user_id is required" });
    }

    const connection = await pool.getConnection();

    try {
      const [cartItems] = await connection.execute(
        "SELECT * FROM cart WHERE id = ? AND user_id = ?",
        [cartId, user_id]
      );

      if ((cartItems as any[]).length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Cart item not found" });
      }

      await connection.execute("DELETE FROM cart WHERE id = ?", [cartId]);

      res.json({
        success: true,
        message: "Item removed from cart",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error removing from cart:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to remove item from cart" });
  }
}) as RequestHandler);

router.post("/calculate-total", (async (req, res) => {
  try {
    const { coupon_code, wallet_points_used, user_id } = req.body;

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "user_id is required" });
    }

    const connection = await pool.getConnection();

    try {
      const [cartItems] = await connection.execute(
        `SELECT c.*, p.price FROM cart c
         JOIN products p ON c.product_id = p.id
         WHERE c.user_id = ?`,
        [user_id]
      );

      if ((cartItems as any[]).length === 0) {
        return res.json({
          success: true,
          subtotal: 0,
          discount: 0,
          wallet_deduction: 0,
          total: 0,
        });
      }

      let subtotal = 0;
      (cartItems as any[]).forEach((item: any) => {
        subtotal += item.price * item.quantity;
      });

      let discountAmount = 0;

      if (coupon_code) {
        const [coupons] = await connection.execute(
          `SELECT c.* FROM coupons c
           JOIN user_coupons uc ON c.id = uc.coupon_id
           WHERE c.code = ? AND uc.user_id = ? AND (c.valid_until IS NULL OR c.valid_until > NOW())`,
          [coupon_code, user_id]
        );

        if ((coupons as any[]).length > 0) {
          const coupon = (coupons as any[])[0];
          discountAmount = (subtotal * coupon.discount_percent) / 100;
        }
      }

      let walletDeduction = 0;
      if (wallet_points_used && wallet_points_used > 0) {
        const [users] = await connection.execute(
          "SELECT wallet_points FROM users WHERE id = ?",
          [user_id]
        );

        const user = (users as any[])[0];
        walletDeduction = Math.min(wallet_points_used, user.wallet_points);
      }

      const total = Math.max(0, subtotal - discountAmount - walletDeduction);

      res.json({
        success: true,
        subtotal,
        discount: discountAmount,
        wallet_deduction: walletDeduction,
        total,
        item_count: (cartItems as any[]).length,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error calculating total:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to calculate total" });
  }
}) as RequestHandler);

router.delete("/", (async (req, res) => {
  try {
    const user_id = req.query.user_id;

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "user_id is required" });
    }

    const connection = await pool.getConnection();

    try {
      await connection.execute("DELETE FROM cart WHERE user_id = ?", [user_id]);

      res.json({
        success: true,
        message: "Cart cleared successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ success: false, message: "Failed to clear cart" });
  }
}) as RequestHandler);

export default router;
