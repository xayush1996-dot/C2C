import crypto from 'crypto';
import mongoose from 'mongoose';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { createRazorpayOrder } from '../services/razorpayService.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export const createOrder = async (req, res, next) => {
  try {
    const { serviceId } = req.body;

    if (!serviceId) {
      return next(new AppError('Service ID is required', 400));
    }

    // Look up the service using either custom code or standard ObjectId
    const isObjectId = mongoose.isValidObjectId(serviceId);
    const service = await Service.findOne({
      $or: [
        { code: serviceId.trim().toLowerCase() },
        ...(isObjectId ? [{ _id: serviceId }] : [])
      ]
    });

    if (!service) {
      return next(new AppError('Service not found', 400));
    }

    if (!service.isActive) {
      return next(new AppError('Service is currently inactive', 400));
    }

    // Secure Opaque Booking Reference Generation
    const bookingReference = `booking_${crypto.randomBytes(16).toString('hex')}`;

    // Create Booking in PENDING state
    const booking = await Booking.create({
      user: req.user._id,
      service: service._id,
      status: 'PENDING',
      bookingReference
    });

    // Authoritative pricing: determine amount server-side (price in paise)
    const amount = Math.round(service.price * 100);

    // Call Razorpay Order API server-side
    const rzpOrder = await createRazorpayOrder(amount, bookingReference, {
      bookingReference,
      userId: req.user._id.toString(),
      serviceId: service._id.toString()
    });

    // Create Payment record in PENDING state
    const payment = await Payment.create({
      user: req.user._id,
      booking: booking._id,
      amount,
      currency: 'INR',
      razorpayOrderId: rzpOrder.id,
      status: 'PENDING'
    });

    logger.info(`[Security Alert] Razorpay Order created. Order ID: ${rzpOrder.id}, Booking Ref: ${bookingReference}, User: ${req.user.email}`);

    res.status(201).json({
      success: true,
      orderId: rzpOrder.id,
      amount,
      currency: 'INR',
      bookingReference,
      keyId: env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Strict Validation
    if (!razorpay_order_id || typeof razorpay_order_id !== 'string') {
      return next(new AppError('Razorpay order ID is required', 400));
    }
    if (!razorpay_payment_id || typeof razorpay_payment_id !== 'string') {
      return next(new AppError('Razorpay payment ID is required', 400));
    }
    if (!razorpay_signature || typeof razorpay_signature !== 'string') {
      return next(new AppError('Razorpay signature is required', 400));
    }

    // Lookup payment transaction
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id }).populate('booking');
    if (!payment) {
      return next(new AppError('Payment transaction record not found', 404));
    }

    // Ownership Validation: check current authenticated customer matches payment owner
    if (payment.user.toString() !== req.user._id.toString()) {
      logger.warn(`[Security Alert] Unauthorized payment verification attempt. User: ${req.user.email}, Owner: ${payment.user}`);
      return next(new AppError('Forbidden, ownership verification failed', 403));
    }

    // Replay Protection: Check if already successfully verified
    if (payment.status === 'SUCCESS') {
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully (already processed)'
      });
    }

    if (payment.status !== 'PENDING') {
      return next(new AppError('Payment transaction is not in a pending state', 400));
    }

    // Cryptographic signature check
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Transition state to FAILED atomically
      const failedPayment = await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id, status: 'PENDING' },
        { $set: { status: 'FAILED' } },
        { new: true }
      );
      if (failedPayment) {
        await Booking.findByIdAndUpdate(failedPayment.booking, { $set: { status: 'CANCELLED' } });
      }
      logger.error(`[Security Alert] Cryptographic signature mismatch on verification. Order: ${razorpay_order_id}`);
      return next(new AppError('Invalid payment signature verification failed', 400));
    }

    // Transition state atomically from PENDING to SUCCESS
    const updatedPayment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, status: 'PENDING' },
      {
        $set: {
          status: 'SUCCESS',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature
        }
      },
      { new: true }
    );

    if (!updatedPayment) {
      // Re-check if it was verified in another concurrent thread
      const checkPayment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
      if (checkPayment && checkPayment.status === 'SUCCESS') {
        return res.status(200).json({
          success: true,
          message: 'Payment verified successfully (already processed)'
        });
      }
      return next(new AppError('Payment transaction already processed or state transition invalid', 400));
    }

    // Mark associated Booking as CONFIRMED
    await Booking.findByIdAndUpdate(updatedPayment.booking, { $set: { status: 'CONFIRMED' } });

    logger.info(`[Security Alert] Payment verified successfully. Order ID: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}`);

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate({
        path: 'booking',
        populate: { path: 'service' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      payments
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new AppError('Invalid payment ID format', 400));
    }

    const payment = await Payment.findById(id).populate({
      path: 'booking',
      populate: { path: 'service' }
    });

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    // Ownership check: Customer must own the payment
    if (payment.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Forbidden, payment ownership validation failed', 403));
    }

    res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    next(error);
  }
};
