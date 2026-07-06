import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAllBookings = async (req, res, next) => {
  try {
    const query = {};

    // Safe Filtering (NoSQL Injection mitigation)
    if (req.query.status && typeof req.query.status === 'string') {
      const statusVal = req.query.status.trim().toUpperCase();
      if (['PENDING', 'CONFIRMED', 'CANCELLED', 'NEEDS_REVIEW', 'COMPLETED'].includes(statusVal)) {
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

    const totalBookings = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('user', 'id name email role')
      .populate('service')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const enrichedBookings = [];
    for (const booking of bookings) {
      const payment = await Payment.findOne({ booking: booking._id });
      const bookingObj = booking.toObject();
      bookingObj.paymentStatus = payment ? payment.status : 'PENDING';
      enrichedBookings.push(bookingObj);
    }

    res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalBookings / limit),
        totalResults: totalBookings
      },
      bookings: enrichedBookings
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new AppError('Invalid booking ID format', 400));
    }

    const booking = await Booking.findById(id)
      .populate('user', 'id name email role')
      .populate('service');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    const payment = await Payment.findOne({ booking: booking._id });
    const bookingObj = booking.toObject();
    bookingObj.paymentStatus = payment ? payment.status : 'PENDING';

    res.status(200).json({
      success: true,
      booking: bookingObj
    });
  } catch (error) {
    next(error);
  }
};
