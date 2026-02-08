import { Router } from "express";
import { adminOnly, protectRoute } from "../middleware/auth.middleware.js";
import {
  createProduct,
  deleteProduct,
  getAllCustomers,
  getAllOrders,
  getAllproducts,
  getDashboardStats,
  updateOrderStatus,
  updateProduct,
} from "../controlllers/admin.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.use(protectRoute, adminOnly);

router.post("/products", upload.array("images", 3), createProduct);
router.get("/products", getAllproducts);
router.put("/products/:id", upload.array("images", 3), updateProduct);
router.delete("/products/:id", deleteProduct);


router.get("/orders", getAllOrders);
router.patch("/orders/:orderId/status", updateOrderStatus);

router.get("/customers", getAllCustomers);
router.get("/stats", getDashboardStats);

export default router;
