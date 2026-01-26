import express from "express";
import cors from "cors";
import path from "path";

import connectToDB from "./config/db.js";
import { ENV } from "./config/env.js";

import { clerkMiddleware } from "@clerk/express";
import { inngest, functions } from "./config/inngest.js";
import { serve } from "inngest/express";

const app = express();

/* -------------------- BASIC CONFIG -------------------- */

const __dirname = path.resolve();

// IMPORTANT: Render injects PORT dynamically
const PORT = process.env.PORT;

/* -------------------- MIDDLEWARES -------------------- */

app.use(
  cors({
    origin: ENV.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(clerkMiddleware());

/* -------------------- INNGEST -------------------- */

app.use("/api/inngest", serve({ client: inngest, functions }));

/* -------------------- HEALTH CHECK -------------------- */

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "API is Working" });
});

/* -------------------- PRODUCTION STATIC (OPTIONAL) -------------------- */
/*
⚠️ IMPORTANT:
On Render FREE, you should NOT serve frontend from backend.
Vercel will host frontend.

So we keep this BLOCKED unless you move to a paid plan.
*/
if (ENV.NODE_ENV === "production" && false) {
  app.use(express.static(path.join(__dirname, "../../admin/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../admin/dist/index.html"));
  });
}

/* -------------------- SERVER START -------------------- */

if (!PORT) {
  console.error("❌ PORT is undefined. Render did not inject PORT.");
  process.exit(1);
}

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`✅ Server listening on port ${PORT}`);
  await connectToDB();
});
