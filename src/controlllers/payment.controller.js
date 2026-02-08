import Stripe from "stripe";
import { ENV } from "../config/env.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.models.js";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.models.js";
import { Coupon } from "../models/coupon.model.js";
import { Wallet } from "../models/wallet.model.js";

const stripe = new Stripe(ENV.STRIPE_SECRET_KEY);

export async function createPaymentIntent(req, res) {
  try {
    const { cartItems, shippingAddress, couponCode } = req.body;
    const user = req.user;

    // Validate cart items
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    let subtotal = 0;
    const validatedItems = [];

    for (const item of cartItems) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res
          .status(404)
          .json({ error: `Product ${item.product.name} not found` });
      }

      if (product.stock < item.quantity) {
        return res
          .status(400)
          .json({ error: `Insufficient stock for ${product.name}` });
      }

      subtotal += product.price * item.quantity;
      validatedItems.push({
        product: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        images: product.images[0],
      });
    }

    const shipping = 10.0; // $10
    const tax = subtotal * 0.08; // 8%
    let total = subtotal + shipping + tax;
    let discount = 0;
    let appliedCoupon = null;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode,
        user: user._id,
        isUsed: false,
      });

      if (coupon) {
        const now = new Date();
        if (new Date(coupon.expiresAt) > now) {
          discount = (total * coupon.discount) / 100;
          total = total - discount;
          appliedCoupon = coupon._id;
        }
      }
    }

    if (total <= 0) {
      return res.status(400).json({ error: "Invalid order total" });
    }

    // Calculate coins earned (10 per item)
    const totalItems = validatedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const coinsEarned = totalItems * 10;

    // Create pending order in database first to avoid metadata size limits
    const pendingOrder = await Order.create({
      user: user._id,
      clerkId: user.clerkId,
      orderItems: validatedItems,
      shippingAddress: shippingAddress,
      paymentResult: {
        id: null,
        status: "pending",
      },
      totalPrice: total,
      discount: discount,
      couponUsed: appliedCoupon,
      coinsEarned: coinsEarned,
      status: "pending",
    });

    // find or create the stripe customer
    let customer;
    if (user.stripeCustomerId) {
      // find the customer
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      // create the customer
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          clerkId: user.clerkId,
          userId: user._id.toString(),
        },
      });

      // add the stripe customer ID to the  user object in the DB
      await User.findByIdAndUpdate(user._id, { stripeCustomerId: customer.id });
    }

    // create payment intent with only order ID in metadata (avoids 500 char limit)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // convert to cents
      currency: "usd",
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: pendingOrder._id.toString(),
        userId: user._id.toString(),
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      orderId: pendingOrder._id.toString(),
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);

    // Provide more specific error messages
    if (error.code === 11000) {
      return res
        .status(500)
        .json({ error: "Database constraint error. Please contact support." });
    }

    res.status(500).json({
      error: "Failed to create payment intent",
      message: error.message,
    });
  }
}

export async function handleWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      ENV.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    // ...existing code...

    try {
      const { orderId, userId } = paymentIntent.metadata;

      // Validate metadata
      if (!orderId || !userId) {
        console.error(
          "Missing required metadata in payment intent:",
          paymentIntent.id,
        );
        return res.status(400).json({ error: "Missing required metadata" });
      }

      // Find the pending order
      const order = await Order.findById(orderId);
      if (!order) {
        console.error("Order not found:", orderId);
        return res.status(404).json({ error: "Order not found" });
      }

      // Check if order is already processed
      if (order.paymentResult.status === "succeeded") {
        return res.json({ received: true });
      }

      // Update order with payment information and status
      order.paymentResult = {
        id: paymentIntent.id,
        status: "succeeded",
      };
      order.status = "confirmed";
      await order.save();

      // update product stock
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }

      // clear user's cart after successful order
      await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

      // ...existing code...
    } catch (error) {
      console.error("Error processing order from webhook:", error);
      return res.status(500).json({ error: "Failed to process order" });
    }
  }

  // Handle payment failures
  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;

    // ...existing code...

    try {
      const { orderId } = paymentIntent.metadata;

      if (orderId) {
        // Mark order as failed
        await Order.findByIdAndUpdate(orderId, {
          "paymentResult.status": "failed",
          status: "failed",
        });
        // ...existing code...
      }
    } catch (error) {
      console.error("Error handling failed payment:", error);
    }
  }

  res.json({ received: true });
}

// Manual order confirmation for development (when webhooks aren't available)
export async function confirmOrder(req, res) {
  try {
    const { orderId } = req.body;
    const user = req.user;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify user owns this order
    if (order.user.toString() !== user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Update order status if not already confirmed
    if (order.status === "pending") {
      order.status = "confirmed";
      order.paymentResult = {
        id: order.paymentResult?.id || "manual_confirm",
        status: "succeeded",
      };
      await order.save();

      // Update product stock
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }

      // Clear cart
      await Cart.findOneAndUpdate({ user: user._id }, { $set: { items: [] } });

      // Credit coins to wallet
      if (order.coinsEarned && order.coinsEarned > 0) {
        await Wallet.findOneAndUpdate(
          { user: user._id },
          {
            $inc: {
              coins: order.coinsEarned,
              lifetimeCoins: order.coinsEarned,
            },
            $push: {
              transactions: {
                type: "earned",
                amount: order.coinsEarned,
                description: `Earned from order #${order._id.toString().slice(-8).toUpperCase()}`,
                orderId: order._id,
                createdAt: new Date(),
              },
            },
          },
          { upsert: true, new: true },
        );
      }
    }

    res.status(200).json({ message: "Order confirmed", order });
  } catch (error) {
    console.error("Error confirming order:", error);
    res.status(500).json({ error: "Failed to confirm order" });
  }
}
