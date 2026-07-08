import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.js';
import TrainingVideo from '../models/TrainingVideo.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { AppError } from '../middleware/errorHandler.js';

export const getTrainingVideos = async (req, res, next) => {
  try {
    let hasAccess = false;
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        if (decoded.role === 'ADMIN') {
          hasAccess = true;
        } else if (decoded.role === 'CUSTOMER') {
          const user = await User.findById(decoded.id);
          if (user && !(user.lockoutUntil && user.lockoutUntil > new Date())) {
            // Check for premium videos purchase
            const premiumService = await Service.findOne({ code: 'premium_videos' });
            if (premiumService) {
              const booking = await Booking.findOne({
                user: user._id,
                service: premiumService._id,
                status: 'CONFIRMED'
              });
              if (booking) {
                const payment = await Payment.findOne({ booking: booking._id, status: 'SUCCESS' });
                if (payment) {
                  hasAccess = true;
                }
              }
            }
          }
        }
      } catch (err) {
        // Token is invalid/expired; treat as anonymous client
      }
    }

    const videos = await TrainingVideo.find({}).sort({ createdAt: 1 });
    
    // Sanitize output for non-premium users to protect video files
    const sanitizedVideos = videos.map(vid => {
      const v = vid.toObject();
      if (!hasAccess && !v.isHomePreview) {
        v.videoUrl = ''; // Hide URL
        v.isLocked = true;
      } else {
        v.isLocked = false;
      }
      return v;
    });

    res.status(200).json({
      success: true,
      hasPremiumAccess: hasAccess,
      videos: sanitizedVideos
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminTrainingVideos = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      if (mongoose.isValidObjectId(search)) {
        query = { _id: search };
      } else {
        query = {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        };
      }
    }
    const videos = await TrainingVideo.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      videos
    });
  } catch (error) {
    next(error);
  }
};

export const createTrainingVideo = async (req, res, next) => {
  try {
    const { title, category, duration, description, thumbnailUrl, videoUrl, isHomePreview } = req.body;
    if (!title || !category || !duration || !videoUrl) {
      return next(new AppError('Title, category, duration, and videoUrl are required', 400));
    }
    const video = await TrainingVideo.create({
      title,
      category,
      duration,
      description,
      thumbnailUrl,
      videoUrl,
      isHomePreview: isHomePreview || false
    });
    res.status(201).json({
      success: true,
      video
    });
  } catch (error) {
    next(error);
  }
};

export const updateTrainingVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return next(new AppError('Invalid training video ID format', 400));
    }
    const { title, category, duration, description, thumbnailUrl, videoUrl, isHomePreview } = req.body;
    const video = await TrainingVideo.findById(id);
    if (!video) {
      return next(new AppError('Training video not found', 404));
    }
    if (title) video.title = title;
    if (category) video.category = category;
    if (duration) video.duration = duration;
    if (description !== undefined) video.description = description;
    if (thumbnailUrl !== undefined) video.thumbnailUrl = thumbnailUrl;
    if (videoUrl) video.videoUrl = videoUrl;
    if (isHomePreview !== undefined) video.isHomePreview = isHomePreview;

    await video.save();

    res.status(200).json({
      success: true,
      video
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTrainingVideo = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let video;
    if (mongoose.isValidObjectId(identifier)) {
      video = await TrainingVideo.findByIdAndDelete(identifier);
    } else {
      video = await TrainingVideo.findOneAndDelete({ title: { $regex: new RegExp(`^${identifier}$`, 'i') } });
    }

    if (!video) {
      return next(new AppError('Training video not found with the provided ID or Title', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Training video deleted successfully',
      deletedVideo: video
    });
  } catch (error) {
    next(error);
  }
};
