import { Product } from "../models/product.models.js";
import { Order } from "../models/order.model.js";

export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get personalized recommendations with reasons
export async function getRecommendations(req, res) {
  try {
    const user = req.user;

    // Get user's order history
    const userOrders = await Order.find({ clerkId: user.clerkId })
      .populate("orderItems.product")
      .sort({ createdAt: -1 })
      .limit(10);

    // Extract categories and products the user has bought
    const purchasedCategories = new Set();
    const purchasedProductIds = new Set();

    userOrders.forEach((order) => {
      order.orderItems.forEach((item) => {
        if (item.product) {
          purchasedCategories.add(item.product.category);
          purchasedProductIds.add(item.product._id.toString());
        }
      });
    });

    const recommendations = [];

    // Rule 1: Recommend products from categories user has bought from
    if (purchasedCategories.size > 0) {
      const categoryProducts = await Product.find({
        category: { $in: Array.from(purchasedCategories) },
        _id: { $nin: Array.from(purchasedProductIds) },
      })
        .sort({ averageRating: -1, totalReviews: -1 })
        .limit(6);

      categoryProducts.forEach((product) => {
        recommendations.push({
          product,
          reason: `Because you bought ${product.category.toLowerCase()} products`,
          type: "category_match",
        });
      });
    }

    // Rule 2: Recommend top-rated products if we don't have enough recommendations
    if (recommendations.length < 6) {
      const topRated = await Product.find({
        _id: { $nin: Array.from(purchasedProductIds) },
        averageRating: { $gte: 4 },
        totalReviews: { $gte: 10 },
      })
        .sort({ averageRating: -1, totalReviews: -1 })
        .limit(6 - recommendations.length);

      topRated.forEach((product) => {
        recommendations.push({
          product,
          reason: "Highly rated by our customers",
          type: "top_rated",
        });
      });
    }

    // Rule 3: Recommend new arrivals if still not enough
    if (recommendations.length < 6) {
      const newArrivals = await Product.find({
        _id: { $nin: Array.from(purchasedProductIds) },
      })
        .sort({ createdAt: -1 })
        .limit(6 - recommendations.length);

      newArrivals.forEach((product) => {
        recommendations.push({
          product,
          reason: "New arrival - Just for you",
          type: "new_arrival",
        });
      });
    }

    res.status(200).json({ recommendations });
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
