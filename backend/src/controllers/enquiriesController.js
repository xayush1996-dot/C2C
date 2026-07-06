import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';
import Enquiry from '../models/Enquiry.js';

export const submitEnquiry = async (req, res, next) => {
  try {
    const { name, email, subject, message, honey } = req.body;

    // Spam resistance: Honeypot check
    // If the hidden 'honey' field is populated, silently drop the submission (spoofing success)
    if (honey) {
      logger.warn(`[Security Alert] Bot spam detected via honeypot field. IP: ${req.ip}`);
      return res.status(201).json({
        success: true,
        message: 'Enquiry submitted successfully'
      });
    }

    // Strict validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return next(new AppError('Name is required', 400));
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return next(new AppError('Email is required', 400));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return next(new AppError('Please provide a valid email address', 400));
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return next(new AppError('Message is required', 400));
    }

    if (message.trim().length < 10) {
      return next(new AppError('Message must be at least 10 characters long', 400));
    }

    if (message.trim().length > 5000) {
      return next(new AppError('Message must not exceed 5000 characters', 400));
    }

    if (name.trim().length > 100) {
      return next(new AppError('Name must not exceed 100 characters', 400));
    }

    if (subject && (typeof subject !== 'string' || subject.trim().length > 200)) {
      return next(new AppError('Subject must not exceed 200 characters', 400));
    }

    // Allowed-field whitelisting / Mass Assignment prevention
    const enquiryData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject ? subject.trim() : '',
      message: message.trim()
    };

    // Optionally associate with authenticated customer
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        if (decoded.role === 'CUSTOMER') {
          enquiryData.user = decoded.id;
        }
      } catch (err) {
        // Silently ignore token decoding issues on a public endpoint
      }
    }

    const enquiry = await Enquiry.create(enquiryData);

    logger.info(`[Security Alert] Successful enquiry submission. ID: ${enquiry._id}, IP: ${req.ip}`);

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      enquiry: {
        id: enquiry._id,
        name: enquiry.name,
        email: enquiry.email,
        subject: enquiry.subject,
        message: enquiry.message,
        status: enquiry.status
      }
    });
  } catch (error) {
    next(error);
  }
};
