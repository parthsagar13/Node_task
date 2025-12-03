import { Router, RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../config/database";
import { orderSchema, validateRequest } from "../middleware/validation";

const router = Router();

router.post("/place", validateRequest(orderSchema), (async (req, res) => {
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
        `SELECT c.*, p.price, p.stock FROM cart c
         JOIN products p ON c.product_id = p.id
         WHERE c.user_id = ?`,
        [user_id]
      );

      if ((cartItems as any[]).length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Cart is empty" });
      }

      for (const item of cartItems as any[]) {
        if (item.quantity > item.stock) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product ${item.product_id}`,
          });
        }
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

      let walletPointsUsed = 0;
      if (wallet_points_used && wallet_points_used > 0) {
        const [users] = await connection.execute(
          "SELECT wallet_points FROM users WHERE id = ?",
          [user_id]
        );

        const user = (users as any[])[0];
        walletPointsUsed = Math.min(wallet_points_used, user.wallet_points);
      }

      const totalPrice = Math.max(
        0,
        subtotal - discountAmount - walletPointsUsed
      );

      const orderId = uuidv4();

      await connection.execute(
        `INSERT INTO orders (id, user_id, total_price, discount_amount, wallet_points_used, coupon_code, payment_status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          user_id,
          totalPrice,
          discountAmount,
          walletPointsUsed,
          coupon_code || null,
          "pending",
        ]
      );

      for (const item of cartItems as any[]) {
        const orderItemId = uuidv4();

        await connection.execute(
          `INSERT INTO order_items (id, order_id, product_id, quantity, price)
           VALUES (?, ?, ?, ?, ?)`,
          [orderItemId, orderId, item.product_id, item.quantity, item.price]
        );

        await connection.execute(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
          [item.quantity, item.product_id]
        );
      }

      if (walletPointsUsed > 0) {
        await connection.execute(
          "UPDATE users SET wallet_points = wallet_points - ? WHERE id = ?",
          [walletPointsUsed, user_id]
        );
      }

      await connection.execute("DELETE FROM cart WHERE user_id = ?", [user_id]);

      res.status(201).json({
        success: true,
        message: "Order placed successfully. Awaiting payment confirmation.",
        order: {
          id: orderId,
          total_price: totalPrice,
          discount_amount: discountAmount,
          wallet_points_used: walletPointsUsed,
          payment_status: "pending",
          coupon_code,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
}) as RequestHandler);

router.get("/:orderId", (async (req, res) => {
  try {
    const { orderId } = req.params;
    const user_id = req.query.user_id;

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "user_id is required" });
    }

    const connection = await pool.getConnection();

    try {
      const [orders] = await connection.execute(
        "SELECT * FROM orders WHERE id = ? AND user_id = ?",
        [orderId, user_id]
      );

      if ((orders as any[]).length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      const order = (orders as any[])[0];

      const [items] = await connection.execute(
        `SELECT oi.*, p.name FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [orderId]
      );

      res.json({
        success: true,
        order: {
          ...order,
          items: items as any[],
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
}) as RequestHandler);

router.get("/", (async (req, res) => {
  try {
    const user_id = req.query.user_id;

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "user_id is required" });
    }

    const connection = await pool.getConnection();

    try {
      const [orders] = await connection.execute(
        `SELECT id, total_price, discount_amount, wallet_points_used, payment_status, order_status, created_at
         FROM orders
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [user_id]
      );

      res.json({
        success: true,
        orders: orders as any[],
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
}) as RequestHandler);

router.put("/payment/:orderId", (async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status || !["success", "failed"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment status" });
    }

    const connection = await pool.getConnection();

    try {
      const [orders] = await connection.execute(
        "SELECT * FROM orders WHERE id = ?",
        [orderId]
      );

      if ((orders as any[]).length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      const order = (orders as any[])[0];

      if (order.payment_status !== "pending") {
        return res
          .status(400)
          .json({ success: false, message: "Order payment already processed" });
      }

      await connection.execute(
        "UPDATE orders SET payment_status = ?, order_status = ? WHERE id = ?",
        [status, status === "success" ? "processing" : "cancelled", orderId]
      );

      if (status === "failed") {
        const [items] = await connection.execute(
          "SELECT * FROM order_items WHERE order_id = ?",
          [orderId]
        );

        for (const item of items as any[]) {
          await connection.execute(
            "UPDATE products SET stock = stock + ? WHERE id = ?",
            [item.quantity, item.product_id]
          );
        }

        if (order.wallet_points_used > 0) {
          await connection.execute(
            "UPDATE users SET wallet_points = wallet_points + ? WHERE id = ?",
            [order.wallet_points_used, order.user_id]
          );
        }
      }

      res.json({
        success: true,
        message: `Payment ${status}`,
        order: {
          id: orderId,
          payment_status: status,
          order_status: status === "success" ? "processing" : "cancelled",
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating payment status:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update payment status" });
  }
}) as RequestHandler);

export default router;
