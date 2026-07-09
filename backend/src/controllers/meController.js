import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

export const getProfile = async (req, res, next) => {
  try {
    // Return only safe fields (customer ownership rules)
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isPremium: req.user.isPremium,
        premiumExpiryDate: req.user.premiumExpiryDate
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const updateData = {};

    // 1. Strict Validation & Whitelisting (Mass Assignment / Security fields protection)
    // Only accept name and email from req.body; ignore role, password, googleId, etc.
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return next(new AppError('Name cannot be empty', 400));
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !email.trim()) {
        return next(new AppError('Email cannot be empty', 400));
      }
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return next(new AppError('Please provide a valid email address', 400));
      }

      // Check if email is already taken by another user
      const emailExists = await User.findOne({ 
        email: trimmedEmail, 
        _id: { $ne: req.user._id } 
      });
      if (emailExists) {
        return next(new AppError('Email already in use', 400));
      }
      updateData.email = trimmedEmail;
    }

    if (Object.keys(updateData).length === 0) {
      return next(new AppError('No valid fields to update', 400));
    }

    // Atomically update user details
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    logger.info(`[Security Alert] Customer profile updated for user: ${updatedUser.email} from IP: ${req.ip}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isPremium: updatedUser.isPremium,
        premiumExpiryDate: updatedUser.premiumExpiryDate
      }
    });
  } catch (error) {
    next(error);
  }
};
