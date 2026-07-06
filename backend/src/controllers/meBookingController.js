import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { AppError } from '../middleware/errorHandler.js';

export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('service')
      .sort({ createdAt: -1 });

    const enrichedBookings = [];
    for (const booking of bookings) {
      const payment = await Payment.findOne({ booking: booking._id });
      const isPaid = payment && payment.status === 'SUCCESS';
      
      const bookingObj = booking.toObject();
      bookingObj.paymentStatus = payment ? payment.status : 'PENDING';
      
      const isExpiredOrCompleted = booking.status === 'COMPLETED' || (booking.scheduledTime && new Date(booking.scheduledTime) < new Date());
      if (isPaid && !isExpiredOrCompleted && booking.service && booking.service.calendlyUrl) {
        bookingObj.unlockedCalendlyUrl = `${booking.service.calendlyUrl}?utm_campaign=${booking.bookingReference}`;
      } else {
        bookingObj.unlockedCalendlyUrl = null;
      }
      enrichedBookings.push(bookingObj);
    }

    res.status(200).json({
      success: true,
      bookings: enrichedBookings
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new AppError('Invalid booking ID format', 400));
    }

    const booking = await Booking.findById(id).populate('service');
    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Forbidden: Booking ownership validation failed', 403));
    }

    const payment = await Payment.findOne({ booking: booking._id });
    const isPaid = payment && payment.status === 'SUCCESS';

    const bookingObj = booking.toObject();
    bookingObj.paymentStatus = payment ? payment.status : 'PENDING';

    const isExpiredOrCompleted = booking.status === 'COMPLETED' || (booking.scheduledTime && new Date(booking.scheduledTime) < new Date());
    if (isPaid && !isExpiredOrCompleted && booking.service && booking.service.calendlyUrl) {
      bookingObj.unlockedCalendlyUrl = `${booking.service.calendlyUrl}?utm_campaign=${booking.bookingReference}`;
    } else {
      bookingObj.unlockedCalendlyUrl = null;
    }

    res.status(200).json({
      success: true,
      booking: bookingObj
    });
  } catch (error) {
    next(error);
  }
};
