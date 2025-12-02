import "dotenv/config";
import express from "express";
import cors from "cors";
import { initializeDatabase } from "./config/database";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import cartRoutes from "./routes/cart";
import orderRoutes from "./routes/orders";

export async function createServer() {
  const app = express();

  // Initialize database
  try {
    await initializeDatabase();
    console.log("Database initialized");
  } catch (error) {
    console.error("Database initialization error:", error);
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/orders", orderRoutes);

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}
