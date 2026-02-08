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
import orderRotes from "./routes/order.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import walletRoutes from "./routes/wallet.routes.js";

const app = express();
const __dirname = path.resolve();
const PORT = process.env.PORT || ENV.PORT || 3000;

app.use(
  cors({
    origin: [
      ENV.FRONTEND_URL,
      "http://localhost:5173",
      "http://192.168.9.236:5173",
      "https://nexent-admin.vercel.app",
      "https://nexent-admin.netlify.app",
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:(3000|5173|8081)$/,
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.netlify\.app$/,
    ],
    credentials: true,
  }),
);

app.use(
  "/api/payment",
  (req, res, next) => {
    if (req.originalUrl === "/api/payment/webhook") {
      express.raw({ type: "application/json" })(req, res, next);
    } else {
      express.json()(req, res, next); // parse json for non-webhook routes
    }
  },
  paymentRoutes,
);

app.use(express.json());
app.use(clerkMiddleware());

app.use("/api/webhooks", webhookRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRotes);
app.use("/api/review", reviewRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wallet", walletRoutes);

app.use((req, res, next) => {
  // ...existing code...
  next();
});
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/users", userRoutes);

// Root route handler
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Nexent Backend API",
    status: "running",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      docs: "https://github.com/nexent/api-docs",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "API is Working" });
});

if (ENV.NODE_ENV === "production" && false) {
  app.use(express.static(path.join(__dirname, "../../admin/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../admin/dist/index.html"));
  });
}
app.listen(PORT, "0.0.0.0", async () => {
  await connectToDB();
});
