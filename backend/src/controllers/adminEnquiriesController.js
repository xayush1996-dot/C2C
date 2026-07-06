import Enquiry from '../models/Enquiry.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

// Escape special characters to prevent Regex injection (ReDoS)
const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

export const getAllEnquiries = async (req, res, next) => {
  try {
    const query = {};

    // 1. Safe Filtering (NoSQL Injection Mitigation)
    // Enforce that filter inputs must be string primitives, ignoring injected objects
    if (req.query.status && typeof req.query.status === 'string') {
      const statusVal = req.query.status.trim().toUpperCase();
      if (['PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(statusVal)) {
        query.status = statusVal;
      }
    }

    if (req.query.email && typeof req.query.email === 'string') {
      query.email = req.query.email.trim().toLowerCase();
    }

    if (req.query.userId && typeof req.query.userId === 'string') {
      // Validate ObjectId format to block malicious ID injection strings
      if (/^[0-9a-fA-F]{24}$/.test(req.query.userId)) {
        query.user = req.query.userId;
      } else {
        return next(new AppError('Invalid user ID filter format', 400));
      }
    }

    // 2. Safe Search
    if (req.query.q && typeof req.query.q === 'string') {
      const searchStr = req.query.q.trim();
      if (searchStr) {
        const escapedQ = escapeRegex(searchStr);
        query.$or = [
          { name: { $regex: escapedQ, $options: 'i' } },
          { email: { $regex: escapedQ, $options: 'i' } },
          { subject: { $regex: escapedQ, $options: 'i' } },
          { message: { $regex: escapedQ, $options: 'i' } }
        ];
      }
    }

    // 3. Pagination
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
    // Cap maximum page size to prevent denial of service (resource exhaustion)
    if (limit > 100) {
      limit = 100;
    }

    const skip = (page - 1) * limit;

    const totalEnquiries = await Enquiry.countDocuments(query);
    const enquiries = await Enquiry.find(query)
      .populate('user', 'id name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalEnquiries / limit),
        totalResults: totalEnquiries
      },
      enquiries
    });
  } catch (error) {
    next(error);
  }
};

export const getEnquiryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new AppError('Invalid enquiry ID format', 400));
    }

    const enquiry = await Enquiry.findById(id).populate('user', 'id name email role');
    if (!enquiry) {
      return next(new AppError('Enquiry not found', 404));
    }

    res.status(200).json({
      success: true,
      enquiry
    });
  } catch (error) {
    next(error);
  }
};

export const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new AppError('Invalid enquiry ID format', 400));
    }

    // Strict validation
    if (!status || typeof status !== 'string') {
      return next(new AppError('Status is required', 400));
    }

    const upperStatus = status.trim().toUpperCase();
    if (!['PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(upperStatus)) {
      return next(new AppError('Invalid status value', 400));
    }

    // Atomically find and update status (Mass Assignment Prevention: only allow status update)
    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      { $set: { status: upperStatus } },
      { new: true, runValidators: true }
    ).populate('user', 'id name email role');

    if (!enquiry) {
      return next(new AppError('Enquiry not found', 404));
    }

    logger.info(`[Security Alert] Enquiry status updated to ${upperStatus} for ID: ${enquiry._id} by Admin ID: ${req.admin._id}`);

    res.status(200).json({
      success: true,
      message: 'Enquiry status updated successfully',
      enquiry
    });
  } catch (error) {
    next(error);
  }
};
