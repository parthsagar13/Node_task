import { Router, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { cartItemSchema, updateCartItemSchema, validateRequest } from '../middleware/validation';

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

// Add to Cart
router.post(
  '/add',
  authUser,
  validateRequest(cartItemSchema),
  (async (req, res) => {
    try {
      const { product_id, quantity } = req.body;
      const userId = (req as any).userId;

      const connection = await pool.getConnection();

      try {
        // Check if product exists
        const [products] = await connection.execute(
          'SELECT * FROM products WHERE id = ?',
          [product_id]
        );

        if ((products as any[]).length === 0) {
          return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if item already in cart
        const [existingCart] = await connection.execute(
          'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
          [userId, product_id]
        );

        if ((existingCart as any[]).length > 0) {
          // Update quantity
          const cartItem = (existingCart as any[])[0];
          await connection.execute(
            'UPDATE cart SET quantity = quantity + ? WHERE id = ?',
            [quantity, cartItem.id]
          );
        } else {
          // Add new cart item
          const cartId = uuidv4();
          await connection.execute(
            'INSERT INTO cart (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)',
            [cartId, userId, product_id, quantity]
          );
        }

        res.status(201).json({
          success: true,
          message: 'Item added to cart',
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ success: false, message: 'Failed to add item to cart' });
    }
  }) as RequestHandler
);

// Get Cart Items
router.get(
  '/items',
  authUser,
  (async (req, res) => {
    try {
      const userId = (req as any).userId;
      const connection = await pool.getConnection();

      try {
        const [cartItems] = await connection.execute(
          `SELECT c.*, p.name, p.price, p.stock FROM cart c
           JOIN products p ON c.product_id = p.id
           WHERE c.user_id = ?
           ORDER BY c.created_at DESC`,
          [userId]
        );

        res.json({
          success: true,
          items: cartItems as any[],
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch cart' });
    }
  }) as RequestHandler
);

// Update Cart Item Quantity
router.put(
  '/:cartId',
  authUser,
  validateRequest(updateCartItemSchema),
  (async (req, res) => {
    try {
      const { cartId } = req.params;
      const { quantity } = req.body;
      const userId = (req as any).userId;

      const connection = await pool.getConnection();

      try {
        // Verify cart item belongs to user
        const [cartItems] = await connection.execute(
          'SELECT * FROM cart WHERE id = ? AND user_id = ?',
          [cartId, userId]
        );

        if ((cartItems as any[]).length === 0) {
          return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        await connection.execute('UPDATE cart SET quantity = ? WHERE id = ?', [quantity, cartId]);

        res.json({
          success: true,
          message: 'Cart updated successfully',
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      res.status(500).json({ success: false, message: 'Failed to update cart' });
    }
  }) as RequestHandler
);

// Remove from Cart
router.delete(
  '/:cartId',
  authUser,
  (async (req, res) => {
    try {
      const { cartId } = req.params;
      const userId = (req as any).userId;

      const connection = await pool.getConnection();

      try {
        // Verify cart item belongs to user
        const [cartItems] = await connection.execute(
          'SELECT * FROM cart WHERE id = ? AND user_id = ?',
          [cartId, userId]
        );

        if ((cartItems as any[]).length === 0) {
          return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        await connection.execute('DELETE FROM cart WHERE id = ?', [cartId]);

        res.json({
          success: true,
          message: 'Item removed from cart',
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ success: false, message: 'Failed to remove item from cart' });
    }
  }) as RequestHandler
);

// Get Cart Total with Discount
router.post(
  '/calculate-total',
  authUser,
  (async (req, res) => {
    try {
      const { coupon_code, wallet_points_used } = req.body;
      const userId = (req as any).userId;

      const connection = await pool.getConnection();

      try {
        // Get cart items
        const [cartItems] = await connection.execute(
          `SELECT c.*, p.price FROM cart c
           JOIN products p ON c.product_id = p.id
           WHERE c.user_id = ?`,
          [userId]
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

        // Calculate subtotal
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
        let walletDeduction = 0;
        if (wallet_points_used && wallet_points_used > 0) {
          const [users] = await connection.execute('SELECT wallet_points FROM users WHERE id = ?', [
            userId,
          ]);

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
      console.error('Error calculating total:', error);
      res.status(500).json({ success: false, message: 'Failed to calculate total' });
    }
  }) as RequestHandler
);

// Clear Cart
router.delete(
  '/',
  authUser,
  (async (req, res) => {
    try {
      const userId = (req as any).userId;
      const connection = await pool.getConnection();

      try {
        await connection.execute('DELETE FROM cart WHERE user_id = ?', [userId]);

        res.json({
          success: true,
          message: 'Cart cleared successfully',
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ success: false, message: 'Failed to clear cart' });
    }
  }) as RequestHandler
);

export default router;
