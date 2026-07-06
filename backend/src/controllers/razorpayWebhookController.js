import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import ProcessedWebhookEvent from '../models/ProcessedWebhookEvent.js';
import { verifyWebhookSignature } from '../services/razorpayService.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const handleRazorpayWebhook = async (req, res, next) => {
  let eventCreated = false;
  let eventId = '';
  try {
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
      return next(new AppError('Webhook signature header missing', 400));
    }

    // Low-3: Validate that req.rawBody exists and is a valid buffer/string
    if (!req.rawBody || (!Buffer.isBuffer(req.rawBody) && typeof req.rawBody !== 'string')) {
      return next(new AppError('Invalid or missing webhook raw body buffer', 400));
    }

    // Cryptographic signature check on raw body buffer
    const isSignatureValid = verifyWebhookSignature(
      req.rawBody,
      signature,
      env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isSignatureValid) {
      logger.error('[Security Alert] Razorpay Webhook cryptographic signature verification failed');
      return next(new AppError('Invalid webhook signature verification failed', 400));
    }

    const { event, payload } = req.body;
    
    // Construct a unique event ID for idempotency tracking
    const paymentEntity = payload?.payment?.entity;
    const paymentId = paymentEntity?.id;
    eventId = req.body.event_id || `webhook_${event}_${paymentId || 'generic'}`;

    try {
      // Attempt to atomically claim the webhook event ID first (Medium-3)
      await ProcessedWebhookEvent.create({ eventId });
      eventCreated = true;
    } catch (err) {
      if (err.code === 11000) {
        logger.info(`[Security Alert] Duplicate webhook event ignored. Event ID: ${eventId}`);
        return res.status(200).json({
          success: true,
          message: 'Webhook already processed'
        });
      }
      return next(err);
    }

    try {
      // Capture payment.captured events to reconcile missed client verifications
      if (event === 'payment.captured') {
        const orderId = paymentEntity?.order_id;
        if (!orderId) {
          throw new AppError('Order ID missing in webhook payload', 400);
        }

        // Lookup transaction
        const payment = await Payment.findOne({ razorpayOrderId: orderId });
        if (!payment) {
          throw new AppError('Payment transaction not found for webhook reconciliation', 404);
        }

        // Assert amount and currency match (Low-2)
        const capturedAmount = paymentEntity?.amount;
        const capturedCurrency = paymentEntity?.currency;
        if (capturedAmount !== payment.amount || capturedCurrency !== payment.currency) {
          logger.error(`[Security Alert] Webhook amount/currency mismatch. Expected: ${payment.amount} ${payment.currency}, Got: ${capturedAmount} ${capturedCurrency}`);
          throw new AppError('Webhook reconciliation failed: amount or currency mismatch', 400);
        }

        // Perform Reconciliation atomically (Medium-1)
        const updatedPayment = await Payment.findOneAndUpdate(
          { razorpayOrderId: orderId, status: 'PENDING' },
          {
            $set: {
              status: 'SUCCESS',
              razorpayPaymentId: paymentId,
              razorpaySignature: 'webhook_reconciled'
            }
          },
          { new: true }
        );

        if (updatedPayment) {
          await Booking.findByIdAndUpdate(updatedPayment.booking, { $set: { status: 'CONFIRMED' } });
          logger.info(`[Security Alert] Webhook reconciled successfully. Order ID: ${orderId}, Payment ID: ${paymentId}`);
        } else {
          logger.info(`[Security Alert] Webhook received for already processed payment. Order ID: ${orderId}`);
        }
      } else if (event === 'payment.failed') {
        const orderId = paymentEntity?.order_id;
        if (orderId) {
          const updatedPayment = await Payment.findOneAndUpdate(
            { razorpayOrderId: orderId, status: 'PENDING' },
            {
              $set: {
                status: 'FAILED',
                razorpayPaymentId: paymentId
              }
            },
            { new: true }
          );
          if (updatedPayment) {
            await Booking.findByIdAndUpdate(updatedPayment.booking, { $set: { status: 'CANCELLED' } });
            logger.info(`[Security Alert] Webhook processed: payment failed. Order ID: ${orderId}, Payment ID: ${paymentId}`);
          }
        }
      } else if (event === 'refund.processed' || event === 'refund.created') {
        const refundPaymentId = payload?.refund?.entity?.payment_id;
        if (refundPaymentId) {
          const updatedPayment = await Payment.findOneAndUpdate(
            { razorpayPaymentId: refundPaymentId, status: 'SUCCESS' },
            { $set: { status: 'REFUNDED' } },
            { new: true }
          );
          if (updatedPayment) {
            await Booking.findByIdAndUpdate(updatedPayment.booking, { $set: { status: 'CANCELLED' } });
            logger.info(`[Security Alert] Webhook processed: refund. Order ID: ${updatedPayment.razorpayOrderId}, Payment ID: ${refundPaymentId}`);
          }
        }
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (bizError) {
      if (eventCreated) {
        await ProcessedWebhookEvent.deleteOne({ eventId });
      }
      throw bizError;
    }
  } catch (error) {
    next(error);
  }
};
