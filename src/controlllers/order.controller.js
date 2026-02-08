import { Order } from "../models/order.model.js";
import { Product } from "../models/product.models.js";
import { Review } from "../models/review.models.js";
import { Wallet } from "../models/wallet.model.js";
import { Coupon } from "../models/coupon.model.js";
import { User } from "../models/user.model.js";
import { sendOrderConfirmationEmail } from "../lib/email.js";

export async function createOrder(req, res) {
  try {
    const user = req.user;
    const {
      orderItems,
      shippingAddress,
      paymentResult,
      totalPrice,
      couponCode,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ error: "No order items" });
    }

    // Validate stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res
          .status(404)
          .json({ error: `Product ${item.name} not found` });
      }
      if (product.stock < item.quantity) {
        return res
          .status(400)
          .json({ error: `Insufficient stock for ${product.name}` });
      }
    }

    let discount = 0;
    let couponUsed = null;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode,
        clerkId: user.clerkId,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });

      if (coupon && totalPrice >= 100) {
        discount = (totalPrice * coupon.discount) / 100;
        couponUsed = coupon._id;

        // Mark coupon as used
        coupon.isUsed = true;
        coupon.usedAt = new Date();
        await coupon.save();
      }
    }

    // Calculate coins earned (10 coins per product)
    const coinsEarned = orderItems.length * 10;

    const finalPrice = totalPrice - discount;

    const order = await Order.create({
      user: user._id,
      clerkId: user.clerkId,
      orderItems,
      shippingAddress,
      paymentResult,
      totalPrice: finalPrice,
      discount,
      couponUsed,
      coinsEarned,
    });

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    // Update wallet with coins
    let wallet = await Wallet.findOne({ clerkId: user.clerkId });
    if (!wallet) {
      wallet = await Wallet.create({
        user: user._id,
        clerkId: user.clerkId,
        coins: 0,
        lifetimeCoins: 0,
        transactions: [],
      });
      await User.findByIdAndUpdate(user._id, { wallet: wallet._id });
    }

    wallet.coins += coinsEarned;
    wallet.lifetimeCoins += coinsEarned;
    wallet.transactions.push({
      type: "earned",
      amount: coinsEarned,
      description: `Earned from order #${order._id}`,
      orderId: order._id,
    });
    await wallet.save();

    // Update coupon with order ID
    if (couponUsed) {
      await Coupon.findByIdAndUpdate(couponUsed, { orderId: order._id });
    }

    // Send confirmation email
    try {
      const populatedOrder = await Order.findById(order._id).populate(
        "orderItems.product",
      );
      await sendOrderConfirmationEmail(populatedOrder, user.email, user.name);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't fail the order if email fails
    }

    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    console.error("Error in createOrder controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function hideOrder(req, res) {
  try {
    const { orderId } = req.params;
    const user = req.user;

    // ...existing code...

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify user owns this order
    if (order.clerkId !== user.clerkId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Soft delete by setting hidden to true
    order.hidden = true;
    await order.save();

    res.status(200).json({ message: "Order hidden successfully" });
  } catch (error) {
    console.error("Error hiding order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getUserOrders(req, res) {
  try {
    const orders = await Order.find({
      clerkId: req.user.clerkId,
      hidden: { $ne: true },
    })
      .populate("orderItems.product")
      .sort({ createdAt: -1 });

    // ...existing code...

    const orderIds = orders.map((order) => order._id);
    const reviews = await Review.find({ orderId: { $in: orderIds } });

    // ...existing code...

    // Group reviews by orderId for efficient lookup
    const reviewsByOrder = reviews.reduce((acc, review) => {
      const orderId = review.orderId.toString();
      if (!acc[orderId]) acc[orderId] = [];
      acc[orderId].push({
        productId: review.productId.toString(),
        rating: review.rating,
        reviewId: review._id.toString(),
      });
      return acc;
    }, {});

    // ...existing code...

    const ordersWithReviewStatus = await Promise.all(
      orders.map(async (order) => {
        const orderId = order._id.toString();
        const orderReviews = reviewsByOrder[orderId] || [];

        // Check if ALL products in the order have been reviewed
        // Filter out null products (deleted products)
        const allProductIds = order.orderItems
          .filter((item) => item.product && item.product._id)
          .map((item) => item.product._id.toString());

        const reviewedProductIds = orderReviews.map((r) => r.productId);
        const hasReviewed =
          allProductIds.length > 0 &&
          allProductIds.every((productId) =>
            reviewedProductIds.includes(productId),
          );

        // Create a map of productId -> rating for easy lookup
        const productRatings = {};
        orderReviews.forEach((review) => {
          productRatings[review.productId] = review.rating;
        });

        // Convert to plain object and filter out null products
        const orderObj = order.toObject();
        orderObj.orderItems = orderObj.orderItems.filter(
          (item) => item.product != null,
        );

        return {
          ...orderObj,
          hasReviewed,
          productRatings, // Add ratings for each product
        };
      }),
    );

    res.status(200).json({ orders: ordersWithReviewStatus });
  } catch (error) {
    console.error("Error in getUserOrders controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Reorder - Copy old order and create new one
export async function reorderOrder(req, res) {
  try {
    const user = req.user;
    const { orderId } = req.params;

    // Find the original order
    const originalOrder =
      await Order.findById(orderId).populate("orderItems.product");

    if (!originalOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify user owns this order
    if (originalOrder.clerkId !== user.clerkId) {
      return res
        .status(403)
        .json({ error: "Not authorized to reorder this order" });
    }

    // Validate stock for all items
    const unavailableItems = [];
    const availableItems = [];

    for (const item of originalOrder.orderItems) {
      if (!item.product) {
        unavailableItems.push({
          name: item.name,
          reason: "Product no longer available",
        });
        continue;
      }

      const currentProduct = await Product.findById(item.product._id);

      if (!currentProduct) {
        unavailableItems.push({
          name: item.name,
          reason: "Product no longer available",
        });
      } else if (currentProduct.stock < item.quantity) {
        unavailableItems.push({
          name: item.name,
          reason: `Only ${currentProduct.stock} in stock (you ordered ${item.quantity})`,
        });
      } else {
        availableItems.push({
          product: {
            _id: currentProduct._id,
            name: currentProduct.name,
            price: currentProduct.price,
            images: currentProduct.images[0],
          },
          name: currentProduct.name,
          price: currentProduct.price,
          quantity: item.quantity,
          images: currentProduct.images[0],
        });
      }
    }

    if (availableItems.length === 0) {
      return res.status(400).json({
        error: "None of the items from this order are available for reorder",
        unavailableItems,
      });
    }

    // Calculate new total
    const totalPrice = availableItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Return the validated cart items for user to proceed with checkout
    res.status(200).json({
      message:
        availableItems.length < originalOrder.orderItems.length
          ? "Some items are unavailable, but we've prepared your cart with available items"
          : "All items are available for reorder",
      cartItems: availableItems,
      totalPrice,
      unavailableItems:
        unavailableItems.length > 0 ? unavailableItems : undefined,
      shippingAddress: originalOrder.shippingAddress,
    });
  } catch (error) {
    console.error("Error in reorderOrder controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
