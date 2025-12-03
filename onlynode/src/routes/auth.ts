import { Router, RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { pool } from "../config/database";
import {
  userRegistrationSchema,
  userLoginSchema,
  sellerRegistrationSchema,
  sellerLoginSchema,
  validateRequest,
} from "../middleware/validation";

const router = Router();

router.post("/user/register", validateRequest(userRegistrationSchema), (async (
  req,
  res
) => {
  try {
    const { name, email, password } = req.body;
    const connection = await pool.getConnection();

    try {
      const [existingUser] = await connection.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if ((existingUser as any[]).length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      await connection.execute(
        "INSERT INTO users (id, name, email, password, wallet_points) VALUES (?, ?, ?, ?, ?)",
        [userId, name, email, hashedPassword, 50]
      );

      const defaultCoupon = await connection.execute(
        "SELECT id FROM coupons LIMIT 1"
      );

      if ((defaultCoupon[0] as any[]).length > 0) {
        const coupon = (defaultCoupon[0] as any[])[0];
        await connection.execute(
          "INSERT INTO user_coupons (id, user_id, coupon_id) VALUES (?, ?, ?)",
          [uuidv4(), userId, coupon.id]
        );
      }

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: { id: userId, name, email, wallet_points: 50 },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
}) as RequestHandler);

router.post("/user/login", validateRequest(userLoginSchema), (async (
  req,
  res
) => {
  try {
    const { email, password } = req.body;
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      const user = (users as any[])[0];

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      res.json({
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          wallet_points: user.wallet_points,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
}) as RequestHandler);

router.post(
  "/seller/register",
  validateRequest(sellerRegistrationSchema),
  (async (req, res) => {
    try {
      const { name, email, password, shop_name } = req.body;
      const connection = await pool.getConnection();

      try {
        const [existingSeller] = await connection.execute(
          "SELECT * FROM sellers WHERE email = ?",
          [email]
        );

        if ((existingSeller as any[]).length > 0) {
          return res
            .status(400)
            .json({ success: false, message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const sellerId = uuidv4();

        await connection.execute(
          "INSERT INTO sellers (id, name, email, password, shop_name) VALUES (?, ?, ?, ?, ?)",
          [sellerId, name, email, hashedPassword, shop_name]
        );

        res.status(201).json({
          success: true,
          message: "Seller registered successfully",
          seller: { id: sellerId, name, email, shop_name },
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Seller registration error:", error);
      res.status(500).json({ success: false, message: "Registration failed" });
    }
  }) as RequestHandler
);

router.post("/seller/login", validateRequest(sellerLoginSchema), (async (
  req,
  res
) => {
  try {
    const { email, password } = req.body;
    const connection = await pool.getConnection();

    try {
      const [sellers] = await connection.execute(
        "SELECT * FROM sellers WHERE email = ?",
        [email]
      );

      const seller = (sellers as any[])[0];

      if (!seller) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, seller.password);

      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      res.json({
        success: true,
        message: "Login successful",
        seller: {
          id: seller.id,
          name: seller.name,
          email: seller.email,
          shop_name: seller.shop_name,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
}) as RequestHandler);

export default router;
