import express from "express";
import cors from "cors";
import path from "path";
import connectToDB from "./config/db.js";
import { ENV } from "./config/env.js";
import { clerkMiddleware } from "@clerk/express";
import { inngest, functions } from "./config/inngest.js";
import { serve } from "inngest/express";

import webhookRoutes from "./routes/webhook.route.js";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.routes.js";
import orderRoutes from "./routes/order.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import walletRoutes from "./routes/wallet.routes.js";

const app = express();
const __dirname = path.resolve();
const PORT = process.env.PORT || ENV.PORT || 3000;

// Tracks whether MongoDB is fully connected.
// Health check returns 503 until this is true so the mobile app
// ServerReadyGate waits before firing any data queries.
let isDbReady = false;

/* =========================
   ✅ CORS — MOBILE SAFE
   ========================= */
app.use(
  cors({
    origin: (origin, callback) => {
      // allow mobile apps & browsers
      callback(null, true);
    },
    credentials: true,
  }),
);

/* =========================
   ✅ STRIPE WEBHOOK (RAW)
   ========================= */
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  paymentRoutes,
);

/* =========================
   ✅ JSON PARSER
   ========================= */
app.use(express.json());

/* =========================
   ✅ CLERK — MOBILE SAFE
   ========================= */
app.use(
  clerkMiddleware({
    enableTokenCookie: false, // VERY IMPORTANT for React Native
  }),
);

/* =========================
   ✅ ROUTES
   ========================= */
app.use("/api/webhooks", webhookRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/users", userRoutes);

/* =========================
   ✅ INNGEST
   ========================= */
app.use("/api/inngest", serve({ client: inngest, functions }));

/* =========================
   ✅ HEALTH CHECKS
   ========================= */
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Nexent Backend API",
    status: "running",
    version: "1.0.0",
  });
});

app.get("/api/health", (req, res) => {
  if (!isDbReady) {
    return res.status(503).json({ message: "Database not ready" });
  }
  res.status(200).json({ message: "API is Working", db: "connected" });
});

/* =========================
   ✅ SERVER START
   ========================= */
app.listen(PORT, "0.0.0.0", async () => {
  try {
    await connectToDB();
    isDbReady = true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    // Don't crash - keep server alive but health check returns 503
  }
});
