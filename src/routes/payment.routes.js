import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createPaymentIntent,
  handleWebhook,
  confirmOrder,
} from "../controlllers/payment.controller.js";

const router = Router();

router.post("/create-intent", protectRoute, createPaymentIntent);
router.post("/webhook", handleWebhook);
router.post("/confirm-order", protectRoute, confirmOrder);

export default router;
