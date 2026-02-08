import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getAllproducts } from "../controlllers/admin.controller.js";
import {
  getProductById,
  getRecommendations,
} from "../controlllers/product.controller.js";

const router = Router();

router.get("/", getAllproducts);
router.get("/recommendations/personalized", protectRoute, getRecommendations);
router.get("/:id", protectRoute, getProductById);

export default router;
