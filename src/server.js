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

const app = express();


const __dirname = path.resolve();

// IMPORTANT: Render injects PORT dynamically
const PORT = process.env.PORT || ENV.PORT || 3000;



app.use(
  cors({
    origin: [ENV.FRONTEND_URL, "http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

/* -------------------- WEBHOOKS (before express.json) -------------------- */
app.use("/api/webhooks", webhookRoutes);

app.use(express.json());
app.use(clerkMiddleware());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

/* -------------------- INNGEST -------------------- */

app.use("/api/inngest", serve({ client: inngest, functions }));

/* -------------------- USER ROUTES -------------------- */
app.use("/api/users", userRoutes);
console.log("✅ User routes registered at /api/users");

/* -------------------- HEALTH CHECK -------------------- */

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
  console.log(`✅ Server listening on port ${PORT}`);
  await connectToDB();
});
