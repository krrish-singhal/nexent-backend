import { Order } from "../models/order.model.js";
import { Product } from "../models/product.models.js";
import { Review } from "../models/review.models.js";
import { User } from "../models/user.model.js";
import { sendOrderInvoiceEmail } from "../lib/email.js";

export async function createReview(req, res) {
  try {
    const { productId, orderId, rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const user = req.user;

    // verify order exists and is delivered
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.clerkId !== user.clerkId) {
      return res
        .status(403)
        .json({ error: "Not authorized to review this order" });
    }

    // Allow reviews for confirmed, shipped, and delivered orders
    if (order.status === "pending" || order.status === "failed") {
      return res
        .status(400)
        .json({ error: "Can only review confirmed orders" });
    }

    // verify product is in the order
    const productInOrder = order.orderItems.find(
      (item) => item.product.toString() === productId.toString(),
    );
    if (!productInOrder) {
      return res.status(400).json({ error: "Product not found in this order" });
    }

    // atomic update or create
    const review = await Review.findOneAndUpdate(
      { productId, userId: user._id },
      { rating, orderId, productId, userId: user._id },
      { new: true, upsert: true, runValidators: true },
    );

    // update the product rating with atomic aggregation
    const reviews = await Review.find({ productId });
    const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        averageRating: totalRating / reviews.length,
        totalReviews: reviews.length,
      },
      { new: true, runValidators: true },
    );

    if (!updatedProduct) {
      await Review.findByIdAndDelete(review._id);
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if all products in order are now reviewed
    const orderReviews = await Review.find({ orderId });
    const reviewedProductIds = orderReviews.map((r) => r.productId.toString());
    const orderProductIds = order.orderItems
      .filter((item) => item.product)
      .map((item) => item.product.toString());

    const allReviewed = orderProductIds.every((id) =>
      reviewedProductIds.includes(id),
    );

    // If all products are reviewed, send invoice email (only once using atomic operation)
    if (allReviewed) {
      try {
        // Atomically update invoiceSent to true only if it's currently false
        // This prevents race conditions when multiple reviews are submitted simultaneously
        const updatedOrder = await Order.findOneAndUpdate(
          { _id: orderId, invoiceSent: false },
          { invoiceSent: true },
          { new: true },
        );

        // Only send email if we successfully claimed the invoice sending (updatedOrder will be null if already sent)
        if (updatedOrder) {
          const populatedOrder = await Order.findById(orderId)
            .populate("orderItems.product")
            .populate("user");

          const user = await User.findById(req.user._id);

          if (populatedOrder && user) {
            await sendOrderInvoiceEmail(populatedOrder, user.email, user.name);
          }
        }
      } catch (emailError) {
        console.error("Failed to send invoice email:", emailError);
        // Don't fail the review if email fails
      }
    }

    res.status(201).json({ message: "Review submitted successfully", review });
  } catch (error) {
    console.error("Error in createReview controller:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
}

export async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params;

    const user = req.user;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (review.userId.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this review" });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(reviewId);

    const reviews = await Review.find({ productId });
    const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
    await Product.findByIdAndUpdate(productId, {
      averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
      totalReviews: reviews.length,
    });

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error in deleteReview controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
