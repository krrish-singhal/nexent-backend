import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createOrder,
  getUserOrders,
  hideOrder,
  reorderOrder,
} from "../controlllers/order.controller.js";

const router = Router();

router.post("/", protectRoute, createOrder);
router.get("/", protectRoute, getUserOrders);
router.delete("/:orderId", protectRoute, hideOrder);
router.post("/reorder/:orderId", protectRoute, reorderOrder);

export default router;
