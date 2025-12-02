import { Router, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { orderSchema, paymentStatusSchema, validateRequest } from '../middleware/validation';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify user token
const authUser: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== 'user') {
      return res.status(403).json({ success: false, message: 'Not authorized as user' });
    }

    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Place Order
router.post(
  '/place',
  authUser,
  validateRequest(orderSchema),
  (async (req, res) => {
    try {
      const { coupon_code, wallet_points_used } = req.body;
      const userId = (req as any).userId;

      const connection = await pool.getConnection();

      try {
        // Get cart items
        const [cartItems] = await connection.execute(
          `SELECT c.*, p.price, p.stock FROM cart c
           JOIN products p ON c.product_id = p.id
           WHERE c.user_id = ?`,
          [userId]
        );

        if ((cartItems as any[]).length === 0) {
          return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Check stock availability
        for (const item of cartItems as any[]) {
          if (item.quantity > item.stock) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for product ${item.product_id}`,
            });
          }
        }

        // Calculate totals
        let subtotal = 0;
        (cartItems as any[]).forEach((item: any) => {
          subtotal += item.price * item.quantity;
        });

        let discountAmount = 0;

        // Apply coupon if provided
        if (coupon_code) {
          const [coupons] = await connection.execute(
            `SELECT c.* FROM coupons c
             JOIN user_coupons uc ON c.id = uc.coupon_id
             WHERE c.code = ? AND uc.user_id = ? AND (c.valid_until IS NULL OR c.valid_until > NOW())`,
            [coupon_code, userId]
          );

          if ((coupons as any[]).length > 0) {
            const coupon = (coupons as any[])[0];
            discountAmount = (subtotal * coupon.discount_percent) / 100;
          }
        }

        // Apply wallet points deduction
        let walletPointsUsed = 0;
        if (wallet_points_used && wallet_points_used > 0) {
          const [users] = await connection.execute(
            'SELECT wallet_points FROM users WHERE id = ?',
            [userId]
          );

          const user = (users as any[])[0];
          walletPointsUsed = Math.min(wallet_points_used, user.wallet_points);
        }

        const totalPrice = Math.max(0, subtotal - discountAmount - walletPointsUsed);

        // Create order
        const orderId = uuidv4();

        await connection.execute(
          `INSERT INTO orders (id, user_id, total_price, discount_amount, wallet_points_used, coupon_code, payment_status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [orderId, userId, totalPrice, discountAmount, walletPointsUsed, coupon_code || null, 'pending']
        );

        // Create order items and deduct stock
        for (const item of cartItems as any[]) {
          const orderItemId = uuidv4();

          await connection.execute(
            `INSERT INTO order_items (id, order_id, product_id, quantity, price)
             VALUES (?, ?, ?, ?, ?)`,
            [orderItemId, orderId, item.product_id, item.quantity, item.price]
          );

          // Deduct stock
          await connection.execute(
            'UPDATE products SET stock = stock - ? WHERE id = ?',
            [item.quantity, item.product_id]
          );
        }

        // Deduct wallet points from user
        if (walletPointsUsed > 0) {
          await connection.execute(
            'UPDATE users SET wallet_points = wallet_points - ? WHERE id = ?',
            [walletPointsUsed, userId]
          );
        }

        // Clear cart
        await connection.execute('DELETE FROM cart WHERE user_id = ?', [userId]);

        res.status(201).json({
          success: true,
          message: 'Order placed successfully. Awaiting payment confirmation.',
          order: {
            id: orderId,
            total_price: totalPrice,
            discount_amount: discountAmount,
            wallet_points_used: walletPointsUsed,
            payment_status: 'pending',
            coupon_code,
          },
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error placing order:', error);
      res.status(500).json({ success: false, message: 'Failed to place order' });
    }
  }) as RequestHandler
);

// Get Order Details
router.get(
  '/:orderId',
  authUser,
  (async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = (req as any).userId;

      const connection = await pool.getConnection();

      try {
        // Get order
        const [orders] = await connection.execute(
          'SELECT * FROM orders WHERE id = ? AND user_id = ?',
          [orderId, userId]
        );

        if ((orders as any[]).length === 0) {
          return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = (orders as any[])[0];

        // Get order items
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
      console.error('Error fetching order:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch order' });
    }
  }) as RequestHandler
);

// Get User Orders
router.get(
  '/',
  authUser,
  (async (req, res) => {
    try {
      const userId = (req as any).userId;

      const connection = await pool.getConnection();

      try {
        const [orders] = await connection.execute(
          `SELECT id, total_price, discount_amount, wallet_points_used, payment_status, order_status, created_at
           FROM orders
           WHERE user_id = ?
           ORDER BY created_at DESC`,
          [userId]
        );

        res.json({
          success: true,
          orders: orders as any[],
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
  }) as RequestHandler
);

// Update Payment Status
router.put(
  '/payment/:orderId',
  (async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      // Validate status
      if (!status || !['success', 'failed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid payment status' });
      }

      const connection = await pool.getConnection();

      try {
        const [orders] = await connection.execute('SELECT * FROM orders WHERE id = ?', [orderId]);

        if ((orders as any[]).length === 0) {
          return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = (orders as any[])[0];

        if (order.payment_status !== 'pending') {
          return res
            .status(400)
            .json({ success: false, message: 'Order payment already processed' });
        }

        // Update payment status
        await connection.execute(
          'UPDATE orders SET payment_status = ?, order_status = ? WHERE id = ?',
          [status, status === 'success' ? 'processing' : 'cancelled', orderId]
        );

        if (status === 'failed') {
          // Restore stock for failed orders
          const [items] = await connection.execute(
            'SELECT * FROM order_items WHERE order_id = ?',
            [orderId]
          );

          for (const item of items as any[]) {
            await connection.execute(
              'UPDATE products SET stock = stock + ? WHERE id = ?',
              [item.quantity, item.product_id]
            );
          }

          // Restore wallet points
          if (order.wallet_points_used > 0) {
            await connection.execute(
              'UPDATE users SET wallet_points = wallet_points + ? WHERE id = ?',
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
            order_status: status === 'success' ? 'processing' : 'cancelled',
          },
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ success: false, message: 'Failed to update payment status' });
    }
  }) as RequestHandler
);

export default router;
