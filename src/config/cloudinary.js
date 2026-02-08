import {v2 as cloudinary} from 'cloudinary';
import { ENV } from './env.js';

cloudinary.config({
  api_key:ENV.CLOUDINARY_API_KEY,
  api_secret:ENV.CLOUDINARY_API_SECRET,
  cloud_name:ENV.CLOUDINARY_CLOUD_NAME
})

export default cloudinary