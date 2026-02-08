import { Router } from "express";
import {
  syncUser,
  getCurrentUser,
  addAddress,
  addToWishlist,
  deleteAddress,
  getAddresses,
  getWishlist,
  removeFromWishlist,
  updateAddress,
  getUserProfile,
  updateUserProfile,
} from "../controlllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireAuth } from "@clerk/express";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

// sync route (no auth for testing)
router.post("/sync", syncUser);

// get current user
router.get("/me", requireAuth(), getCurrentUser);

// protected routes
router.use(protectRoute);

// profile routes
router.get("/profile", getUserProfile);
router.put("/profile", upload.single("profileImage"), updateUserProfile);

// address routes
router.post("/addresses", addAddress);
router.get("/addresses", getAddresses);
router.put("/addresses/:addressId", updateAddress);
router.delete("/addresses/:addressId", deleteAddress);

// wishlist routes
router.post("/wishlist", addToWishlist);
router.delete("/wishlist/:productId", removeFromWishlist);
router.get("/wishlist", getWishlist);

export default router;
