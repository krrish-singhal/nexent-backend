import { Wallet } from "../models/wallet.model.js";
import { Coupon } from "../models/coupon.model.js";
import { User } from "../models/user.model.js";

// Get or create wallet for user
export async function getWallet(req, res) {
  try {
    const user = req.user;

    let wallet = await Wallet.findOne({ clerkId: user.clerkId });

    if (!wallet) {
      wallet = await Wallet.create({
        user: user._id,
        clerkId: user.clerkId,
        coins: 0,
        lifetimeCoins: 0,
        transactions: [],
      });

      // Update user reference
      await User.findByIdAndUpdate(user._id, { wallet: wallet._id });
    }

    res.status(200).json({ wallet });
  } catch (error) {
    console.error("Error in getWallet controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Redeem coins for coupon
export async function redeemCoupon(req, res) {
  try {
    const user = req.user;
    const { type } = req.body; // bronze, silver, or gold

    const wallet = await Wallet.findOne({ clerkId: user.clerkId });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Define coupon tiers
    const couponTiers = {
      bronze: { coinsRequired: 100, discount: 10 },
      silver: { coinsRequired: 300, discount: 35 },
      gold: { coinsRequired: 500, discount: 60 },
    };

    const tier = couponTiers[type];
    if (!tier) {
      return res.status(400).json({ error: "Invalid coupon type" });
    }

    if (wallet.coins < tier.coinsRequired) {
      return res.status(400).json({
        error: `Insufficient coins. You need ${tier.coinsRequired} coins but have ${wallet.coins}`,
      });
    }

    // Generate unique 6-letter coupon code
    const generateCouponCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let couponCode;
    let isUnique = false;

    // Ensure the code is unique
    while (!isUnique) {
      couponCode = generateCouponCode();
      const existingCoupon = await Coupon.findOne({ code: couponCode });
      if (!existingCoupon) {
        isUnique = true;
      }
    }

    // Create coupon (valid for 30 days from redemption, single use)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const coupon = await Coupon.create({
      user: user._id,
      clerkId: user.clerkId,
      code: couponCode,
      type,
      discount: tier.discount,
      coinsRequired: tier.coinsRequired,
      expiresAt,
    });

    // Deduct coins from wallet
    wallet.coins -= tier.coinsRequired;
    wallet.transactions.push({
      type: "redeemed",
      amount: -tier.coinsRequired,
      description: `Redeemed ${type} coupon (${tier.discount}% off)`,
      couponId: coupon._id,
    });

    await wallet.save();

    // Format expiry date for user message
    const expiryDate = expiresAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    res.status(200).json({
      message: `Coupon redeemed successfully! Your coupon code is ${couponCode}. This coupon is valid for one-time use only and will expire on ${expiryDate} (30 days from now). Use it before it expires!`,
      coupon,
      wallet,
      expiryInfo: {
        expiresAt: expiresAt,
        expiryDate: expiryDate,
        daysValid: 30,
        singleUse: true,
      },
    });
  } catch (error) {
    console.error("Error in redeemCoupon controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get user coupons
export async function getUserCoupons(req, res) {
  try {
    const user = req.user;

    const coupons = await Coupon.find({
      clerkId: user.clerkId,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    res.status(200).json({ coupons });
  } catch (error) {
    console.error("Error in getUserCoupons controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Validate coupon
export async function validateCoupon(req, res) {
  try {
    const user = req.user;
    const { code, orderValue } = req.body;

    // First check if coupon exists for this user
    const couponCheck = await Coupon.findOne({
      code,
      clerkId: user.clerkId,
    });

    if (!couponCheck) {
      return res.status(404).json({
        error: "Coupon not found",
      });
    }

    // Check if already used
    if (couponCheck.isUsed) {
      return res.status(400).json({
        error: "This coupon has already been used",
      });
    }

    // Check if expired
    if (couponCheck.expiresAt <= new Date()) {
      return res.status(400).json({
        error: "Coupon has expired",
      });
    }

    const coupon = couponCheck;

    // Check minimum order value ($100)
    if (orderValue < 100) {
      return res.status(400).json({
        error: "Order value must be at least $100 to use this coupon",
      });
    }

    const discount = (orderValue * coupon.discount) / 100;

    res.status(200).json({
      valid: true,
      coupon,
      discount,
      finalPrice: orderValue - discount,
    });
  } catch (error) {
    console.error("Error in validateCoupon controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get wallet transactions
export async function getTransactions(req, res) {
  try {
    const user = req.user;

    const wallet = await Wallet.findOne({ clerkId: user.clerkId })
      .populate("transactions.orderId")
      .populate("transactions.couponId");

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    res.status(200).json({ transactions: wallet.transactions });
  } catch (error) {
    console.error("Error in getTransactions controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
