import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { AppError } from '../middleware/errorHandler.js';

export const getCustomers = async (req, res, next) => {
  try {
    const query = { role: 'CUSTOMER' };

    // Regex Search on Name/Email (Safe from ReDoS)
    if (req.query.search && typeof req.query.search === 'string') {
      const searchVal = req.query.search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // Escape regex chars
      if (searchVal) {
        query.$or = [
          { name: { $regex: searchVal, $options: 'i' } },
          { email: { $regex: searchVal, $options: 'i' } }
        ];
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

    const totalCustomers = await User.countDocuments(query);
    
    // Minimal Data Exposure: select only safe fields
    const customers = await User.find(query)
      .select('id name email createdAt updatedAt googleId failedLoginAttempts lockoutUntil')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCustomers / limit),
        totalResults: totalCustomers
      },
      customers
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new AppError('Invalid customer ID format', 400));
    }

    // Minimal Data Exposure: select only safe fields
    const customer = await User.findOne({ _id: id, role: 'CUSTOMER' })
      .select('id name email createdAt updatedAt googleId failedLoginAttempts lockoutUntil');

    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    // Fetch recent bookings
    const bookings = await Booking.find({ user: id })
      .populate('service')
      .sort({ createdAt: -1 })
      .limit(10);

    // Fetch recent payments
    const payments = await Payment.find({ user: id })
      .populate({
        path: 'booking',
        populate: { path: 'service' }
      })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      customer,
      bookings,
      payments
    });
  } catch (error) {
    next(error);
  }
};
