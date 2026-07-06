import Payment from '../models/Payment.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAllPayments = async (req, res, next) => {
  try {
    const query = {};

    // Safe Filtering (NoSQL Injection mitigation)
    if (req.query.status && typeof req.query.status === 'string') {
      const statusVal = req.query.status.trim().toUpperCase();
      if (['PENDING', 'SUCCESS', 'FAILED'].includes(statusVal)) {
        query.status = statusVal;
      }
    }

    if (req.query.userId && typeof req.query.userId === 'string') {
      if (/^[0-9a-fA-F]{24}$/.test(req.query.userId)) {
        query.user = req.query.userId;
      } else {
        return next(new AppError('Invalid user ID filter format', 400));
      }
    }

    // Pagination
    let page = 1;
    if (req.query.page) {
      const parsedPage = parseInt(req.query.page, 10);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        page = parsedPage;
      }
    }

    let limit = 10;
    if (req.query.limit) {
      const parsedLimit = parseInt(req.query.limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }

    if (limit > 100) {
      limit = 100;
    }

    const skip = (page - 1) * limit;

    const totalPayments = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('user', 'id name email role')
      .populate({
        path: 'booking',
        populate: { path: 'service' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalPayments / limit),
        totalResults: totalPayments
      },
      payments
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new AppError('Invalid payment ID format', 400));
    }

    const payment = await Payment.findById(id)
      .populate('user', 'id name email role')
      .populate({
        path: 'booking',
        populate: { path: 'service' }
      });

    if (!payment) {
      return next(new AppError('Payment transaction not found', 404));
    }

    res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    next(error);
  }
};
