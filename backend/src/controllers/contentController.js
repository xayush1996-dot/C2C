import Content from '../models/Content.js';
import { AppError } from '../middleware/errorHandler.js';

export const getContent = async (req, res, next) => {
  try {
    const contentList = await Content.find({});
    const contentMap = {};
    contentList.forEach(item => {
      contentMap[item.key] = item.value;
    });
    
    res.status(200).json({
      success: true,
      content: contentMap
    });
  } catch (error) {
    next(error);
  }
};

export const updateContent = async (req, res, next) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return next(new AppError('Both key and value are required', 400));
    }

    const updatedContent = await Content.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: updatedContent
    });
  } catch (error) {
    next(error);
  }
};
