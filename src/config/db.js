import mongoose from 'mongoose'
import { ENV } from './env.js'


const connectToDB=async() => {
  

  try {
    const conn= await mongoose.connect(ENV.MONGODB_URI);
    console.log("MONGODB Connected Sucessfully");
    
  } catch (error) {
    console.error("MONGoDB Connection Failed");
    process.exit(1);
  }
}

export default connectToDB;