import { requireAuth } from "@clerk/express";
import { User } from "../models/user.model.js";
import { ENV } from "../config/env.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;
      if (!clerkId) {
        return res.status(401).json({
          message: "Unauthorized - invalid token",
        });
      }

      const user = await User.findOne({ clerkId });
      if (!user) return res.status(404).json({ message: "User not found" });

      req.user = user;
      next();
    } catch (error) {
      // ...existing code...
      res.status(500).json({ message: "Internal server error" });
    }
  },
];

export const adminOnly = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - user not found" });
  }

  // ...existing code...

  if (req.user.email !== ENV.ADMIN_EMAIL) {
    return res.status(403).json({
      message: "Forbidden - admin access only",
      userEmail: req.user.email,
      adminEmail: ENV.ADMIN_EMAIL,
    });
  }
  next();
};
