import { User } from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

// Sync user to MongoDB after Clerk sign-in
export const syncUser = async (req, res) => {
  try {
    const { clerkUserId, email, firstName, lastName, imageUrl } = req.body;

    if (!clerkUserId || !email) {
      return res
        .status(400)
        .json({ error: "Missing required user data (clerkUserId, email)" });
    }

    // Check if user already exists
    let user = await User.findOne({ clerkId: clerkUserId });

    if (!user) {
      // Create new user
      user = await User.create({
        clerkId: clerkUserId,
        email: email,
        name: `${firstName || ""} ${lastName || ""}`.trim() || "User",
        imageUrl: imageUrl || "",
        addresses: [],
        wishlist: [],
      });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: error.message });
  }
};

export async function addAddress(req, res) {
  try {
    const {
      label,
      fullName,
      streetAddress,
      city,
      state,
      zipCode,
      phoneNumber,
      isDefault,
    } = req.body;

    const user = req.user;

    if (!fullName || !streetAddress || !city || !state || !zipCode) {
      return res.status(400).json({ error: "Missing required address fields" });
    }

    // if this is set as default, unset all other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      label,
      fullName,
      streetAddress,
      city,
      state,
      zipCode,
      phoneNumber,
      isDefault: isDefault || false,
    });

    await user.save();

    res.status(201).json({
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Error in addAddress controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAddresses(req, res) {
  try {
    const user = req.user;

    res.status(200).json({ addresses: user.addresses });
  } catch (error) {
    console.error("Error in getAddresses controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateAddress(req, res) {
  try {
    const {
      label,
      fullName,
      streetAddress,
      city,
      state,
      zipCode,
      phoneNumber,
      isDefault,
    } = req.body;

    const { addressId } = req.params;

    const user = req.user;
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    // if this is set as default, unset all other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    address.label = label || address.label;
    address.fullName = fullName || address.fullName;
    address.streetAddress = streetAddress || address.streetAddress;
    address.city = city || address.city;
    address.state = state || address.state;
    address.zipCode = zipCode || address.zipCode;
    address.phoneNumber = phoneNumber || address.phoneNumber;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await user.save();

    res.status(200).json({
      message: "Address updated successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Error in updateAddress controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteAddress(req, res) {
  try {
    const { addressId } = req.params;
    const user = req.user;

    user.addresses.pull(addressId);
    await user.save();

    res.status(200).json({
      message: "Address deleted successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Error in deleteAddress controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function addToWishlist(req, res) {
  try {
    const { productId } = req.body;
    const user = req.user;

    // check if product is already in the wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ error: "Product already in wishlist" });
    }

    user.wishlist.push(productId);
    await user.save();

    res
      .status(200)
      .json({ message: "Product added to wishlist", wishlist: user.wishlist });
  } catch (error) {
    console.error("Error in addToWishlist controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function removeFromWishlist(req, res) {
  try {
    const { productId } = req.params;
    const user = req.user;

    // check if product is already in the wishlist
    if (!user.wishlist.includes(productId)) {
      return res.status(400).json({ error: "Product not found in wishlist" });
    }

    user.wishlist.pull(productId);
    await user.save();

    res.status(200).json({
      message: "Product removed from wishlist",
      wishlist: user.wishlist,
    });
  } catch (error) {
    console.error("Error in removeFromWishlist controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getWishlist(req, res) {
  try {
    // we're using populate, bc wishlist is just an array of product ids
    const user = await User.findById(req.user._id).populate("wishlist");

    res.status(200).json({ wishlist: user.wishlist });
  } catch (error) {
    console.error("Error in getWishlist controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getUserProfile(req, res) {
  try {
    const user = req.user;

    res.status(200).json({
      email: user.email,
      name: user.name,
      phone: user.phone || "",
      profileImage: user.profileImage || user.imageUrl || "",
    });
  } catch (error) {
    console.error("Error in getUserProfile controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateUserProfile(req, res) {
  try {
    const user = req.user;
    const { name, phone } = req.body;

    if (name) {
      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    // Handle profile image upload if present
    if (req.file) {
      try {
        // Upload to cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "nexent/profiles",
          transformation: [
            { width: 400, height: 400, crop: "fill" },
            { quality: "auto" },
          ],
        });

        user.profileImage = result.secure_url;
      } catch (uploadError) {
        console.error("Error uploading profile image:", uploadError);
        console.error("Upload error details:", {
          message: uploadError.message,
          error: uploadError.error,
          http_code: uploadError.http_code,
        });
        return res.status(500).json({
          error: "Failed to upload profile image",
          details: uploadError.message,
        });
      }
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      profile: {
        email: user.email,
        name: user.name,
        phone: user.phone,
        profileImage: user.profileImage || user.imageUrl,
      },
    });
  } catch (error) {
    console.error("Error in updateUserProfile controller:", error);
    console.error("Error stack:", error.stack);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
}
