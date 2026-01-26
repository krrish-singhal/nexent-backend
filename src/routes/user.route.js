import express from 'express';
import { User } from '../models/user.model.js';
import { requireAuth, clerkClient } from '@clerk/express';

const router = express.Router();

// Sync user to MongoDB after Clerk sign-in (NO AUTH for testing)
router.post('/sync', async (req, res) => {
  try {
    const { clerkUserId, email, firstName, lastName, imageUrl } = req.body;

    console.log('🔄 Syncing user:', { clerkUserId, email, firstName, lastName });

    if (!clerkUserId || !email) {
      return res.status(400).json({ error: 'Missing required user data (clerkUserId, email)' });
    }

    // Check if user already exists
    let user = await User.findOne({ clerkId: clerkUserId });

    if (!user) {
      // Create new user
      user = await User.create({
        clerkId: clerkUserId,
        email: email,
        name: `${firstName || ""} ${lastName || ""}`.trim() || "User",
        imageUrl: imageUrl || "",
        addresses: [],
        wishlist: [],
      });
      console.log("✅ New user created in MongoDB:", user._id);
    } else {
      console.log("✅ User already exists in MongoDB:", user._id);
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("❌ Error syncing user:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
