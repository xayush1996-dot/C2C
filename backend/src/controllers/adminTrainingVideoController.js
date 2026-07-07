import TrainingVideo from '../models/TrainingVideo.js';
import { AppError } from '../middleware/errorHandler.js';

export const getVideos = async (req, res, next) => {
  try {
    const videos = await TrainingVideo.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      videos
    });
  } catch (error) {
    next(error);
  }
};

export const createVideo = async (req, res, next) => {
  try {
    const { title, category, duration, description, thumbnailUrl, videoUrl } = req.body;

    if (!title || !category || !duration || !videoUrl) {
      return next(new AppError('Title, category, duration, and videoUrl are required', 400));
    }

    const video = await TrainingVideo.create({
      title,
      category,
      duration,
      description,
      thumbnailUrl,
      videoUrl
    });

    res.status(201).json({
      success: true,
      video
    });
  } catch (error) {
    next(error);
  }
};

export const updateVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, category, duration, description, thumbnailUrl, videoUrl } = req.body;

    const video = await TrainingVideo.findById(id);
    if (!video) {
      return next(new AppError('Video not found', 404));
    }

    if (title !== undefined) video.title = title;
    if (category !== undefined) video.category = category;
    if (duration !== undefined) video.duration = duration;
    if (description !== undefined) video.description = description;
    if (thumbnailUrl !== undefined) video.thumbnailUrl = thumbnailUrl;
    if (videoUrl !== undefined) video.videoUrl = videoUrl;

    await video.save();

    res.status(200).json({
      success: true,
      video
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVideo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const video = await TrainingVideo.findByIdAndDelete(id);
    if (!video) {
      return next(new AppError('Video not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
