import crypto from 'crypto';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import ProcessedWebhookEvent from '../models/ProcessedWebhookEvent.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const getEventIdFromUri = (uri) => {
  if (!uri) return null;
  const parts = uri.split('/');
  return parts[parts.length - 1];
};

const findTrackingReference = (tracking) => {
  if (!tracking) return null;
  const keys = Object.keys(tracking);
  for (const key of keys) {
    const val = tracking[key];
    if (typeof val === 'string' && /^booking_[0-9a-fA-F]{32}$/.test(val.trim())) {
      return val.trim();
    }
  }
  return null;
};

export const handleCalendlyWebhook = async (req, res, next) => {
  let eventCreated = false;
  let eventId = '';
  try {
    const sigHeader = req.headers['calendly-webhook-signature'];
    if (!sigHeader) {
      return next(new AppError('Calendly signature header missing', 400));
    }

    const parts = sigHeader.split(',');
    let t = '';
    let v1 = '';
    for (const part of parts) {
      const [key, val] = part.split('=');
      if (key === 't') t = val;
      if (key === 'v1') v1 = val;
    }
    if (!t || !v1) {
      return next(new AppError('Invalid signature header format', 400));
    }

    // Replay attack timestamp drift check (5 minutes / 300 seconds)
    const currentEpoch = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentEpoch - parseInt(t, 10));
    if (timeDiff > 300) {
      return next(new AppError('Webhook timestamp drift is too large', 400));
    }

    // Cryptographic signature verification over raw body
    if (!req.rawBody || (!Buffer.isBuffer(req.rawBody) && typeof req.rawBody !== 'string')) {
      return next(new AppError('Invalid or missing webhook raw body buffer', 400));
    }
    const rawBodyString = Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : req.rawBody;
    const dataToSign = `${t}.${rawBodyString}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.CALENDLY_WEBHOOK_SECRET)
      .update(dataToSign)
      .digest('hex');

    if (expectedSignature !== v1) {
      logger.error('[Security Alert] Calendly Webhook signature verification failed');
      return next(new AppError('Invalid webhook signature verification failed', 400));
    }

    const { event, payload } = req.body;
    const inviteeUri = payload?.uri;
    eventId = req.body.event_id || `calendly_${event}_${inviteeUri || 'generic'}`;

    try {
      // Attempt to atomically claim/insert the webhook event ID first
      await ProcessedWebhookEvent.create({ eventId });
      eventCreated = true;
    } catch (err) {
      if (err.code === 11000) {
        logger.info(`[Security Alert] Duplicate Calendly webhook event ignored. Event ID: ${eventId}`);
        return res.status(200).json({
          success: true,
          message: 'Webhook already processed'
        });
      }
      return next(err);
    }

    try {
      if (event === 'invitee.created') {
        const inviteeEmail = payload?.email;
        if (!inviteeEmail) {
          throw new AppError('Invitee email is missing in payload', 400);
        }

        const bookingReference = findTrackingReference(payload?.tracking);
        let booking = null;

        if (bookingReference) {
          booking = await Booking.findOne({ bookingReference }).populate('user');
          if (!booking) {
            throw new AppError('Booking not found with provided tracking reference', 404);
          }

          // verified paid status required
          const payment = await Payment.findOne({ booking: booking._id, status: 'SUCCESS' });
          if (!payment) {
            booking.status = 'CANCELLED';
            await booking.save();
            throw new AppError('Unpaid booking attempt', 400);
          }

          // wrong customer check
          if (booking.user.email.toLowerCase() !== inviteeEmail.toLowerCase()) {
            throw new AppError('Forbidden: Invitee email does not match booking customer', 403);
          }

          if (booking.status === 'COMPLETED') {
            throw new AppError('Booking is already completed', 400);
          }
        } else {
          // missing tracking reference -> try fallback to customer email
          const user = await User.findOne({ email: inviteeEmail.toLowerCase() });
          if (!user) {
            throw new AppError('Unpaid booking attempt (customer user not found for fallback)', 400);
          }

          const userBookings = await Booking.find({ user: user._id });
          const pendingBookings = [];
          for (const b of userBookings) {
            if (b.status === 'PENDING' || (b.status === 'CONFIRMED' && !b.calendlyEventId)) {
              const hasPaid = await Payment.findOne({ booking: b._id, status: 'SUCCESS' });
              if (hasPaid) {
                pendingBookings.push(b);
              }
            }
          }

          if (pendingBookings.length === 1) {
            // safe fallback only when unambiguous
            booking = pendingBookings[0];
          } else if (pendingBookings.length > 1) {
            // ambiguous bookings become needs_review
            for (const b of pendingBookings) {
              b.status = 'NEEDS_REVIEW';
              await b.save();
            }
            throw new AppError('Ambiguous bookings detected. All matching pending bookings set to NEEDS_REVIEW', 400);
          } else {
            // no paid pending booking found
            throw new AppError('Unpaid booking attempt (no paid pending bookings found for email)', 400);
          }
        }

        // Update the booking details (handles rescheduled/created slot)
        const calendlyEventId = getEventIdFromUri(payload?.event);
        const startTime = payload?.scheduled_event?.start_time || payload?.start_time;

        booking.status = 'CONFIRMED';
        booking.calendlyEventId = calendlyEventId;
        if (startTime) {
          booking.scheduledTime = new Date(startTime);
        }
        await booking.save();

        logger.info(`[Security Alert] Calendly Booking confirmed. Reference: ${booking.bookingReference}, Event: ${calendlyEventId}`);
      } else if (event === 'invitee.canceled') {
        const calendlyEventId = getEventIdFromUri(payload?.event);
        if (calendlyEventId) {
          const booking = await Booking.findOne({ calendlyEventId });
          if (booking) {
            booking.status = 'CANCELLED';
            await booking.save();
            logger.info(`[Security Alert] Calendly Booking canceled. Reference: ${booking.bookingReference}, Event: ${calendlyEventId}`);
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
