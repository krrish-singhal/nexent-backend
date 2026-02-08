import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getWallet,
  redeemCoupon,
  getUserCoupons,
  validateCoupon,
  getTransactions,
} from "../controlllers/wallet.controller.js";

const router = express.Router();

router.get("/", protectRoute, getWallet);
router.post("/redeem", protectRoute, redeemCoupon);
router.get("/coupons", protectRoute, getUserCoupons);
router.post("/validate-coupon", protectRoute, validateCoupon);
router.get("/transactions", protectRoute, getTransactions);

export default router;
