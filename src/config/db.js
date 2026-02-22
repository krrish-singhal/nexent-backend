import mongoose from "mongoose";
import { ENV } from "./env.js";

const connectToDB = async () => {
  try {
    await mongoose.connect(ENV.MONGODB_URI);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectToDB;
