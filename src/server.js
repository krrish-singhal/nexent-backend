import express from "express";
import { ENV } from "./config/env.js";
import connectToDB from "./config/db.js";
import cors from "cors";

import path from "path";
import { clerkMiddleware } from "@clerk/express";
import { functions, inngest } from "./config/inngest.js";
import { serve } from "inngest/express";

const app = express();

const __dirname = path.resolve();

app.use(cors({
  origin: ENV.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(clerkMiddleware());

app.use(express.json());

app.use("/api/inngest", serve({ client: inngest, functions }));

app.get("/api/health", (req, res) => {
  res.json({ message: "API is Working" });
});

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../admin/nexent/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../../admin", "dist", "index.html"));
  });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
  connectToDB();
});
