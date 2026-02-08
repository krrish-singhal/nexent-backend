import mongoose from "mongoose";
import { ENV } from "./env.js";

const connectToDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI);
    // ...existing code...
  } catch (error) {
    // ...existing code...
    process.exit(1);
  }
};

export default connectToDB;
