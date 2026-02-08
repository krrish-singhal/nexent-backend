import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    totalReviews: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    returnPolicy: {
      returnable: {
        type: Boolean,
        default: true,
      },
      refundable: {
        type: Boolean,
        default: true,
      },
      returnDays: {
        type: Number,
        default: 7,
      },
    },
  },
  { timestamps: true },
);

export const Product = mongoose.model("Product", productSchema);
