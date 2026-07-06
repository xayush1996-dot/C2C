import Service from '../models/Service.js';
import { AppError } from '../middleware/errorHandler.js';

export const getServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true });
    res.status(200).json({
      success: true,
      services
    });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, calendlyUrl, isActive } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return next(new AppError('Service not found', 404));
    }

    if (name !== undefined) service.name = name;
    if (description !== undefined) service.description = description;
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return next(new AppError('Price must be a positive number', 400));
      }
      service.price = numPrice;
    }
    if (calendlyUrl !== undefined) service.calendlyUrl = calendlyUrl;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    res.status(200).json({
      success: true,
      service
    });
  } catch (error) {
    next(error);
  }
};
