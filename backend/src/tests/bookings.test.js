import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import ProcessedWebhookEvent from '../models/ProcessedWebhookEvent.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import app from '../app.js';
import { env } from '../config/env.js';

describe('Calendly Webhook & Booking System Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockOtherUserId = new mongoose.Types.ObjectId().toString();
  const mockAdminId = new mongoose.Types.ObjectId().toString();

  const mockServiceId = new mongoose.Types.ObjectId().toString();
  const mockBookingId = new mongoose.Types.ObjectId().toString();
  const mockPaymentId = new mongoose.Types.ObjectId().toString();
  const mockBookingRef = 'booking_a2f8b9d0c2e3f4a5b6c7d8e9f0a1b2c3';

  const mockCustomerUser = {
    _id: mockUserId,
    name: 'Customer User',
    email: 'customer@example.com',
    role: 'CUSTOMER'
  };

  const mockAdminUser = {
    _id: mockAdminId,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    isActive: true
  };

  const mockServiceDoc = {
    _id: mockServiceId,
    code: 'consulting-1h',
    name: '1-Hour Consulting Call',
    description: 'Consulting Session',
    price: 5000,
    calendlyUrl: 'https://calendly.com/consultant/1h',
    isActive: true
  };

  const mockBookingDoc = {
    _id: mockBookingId,
    user: {
      _id: mockUserId,
      email: 'customer@example.com'
    },
    service: mockServiceDoc,
    status: 'PENDING',
    bookingReference: mockBookingRef,
    calendlyEventId: null,
    scheduledTime: null,
    save: jest.fn().mockImplementation(function () { return Promise.resolve(this); })
  };

  const mockPaymentDoc = {
    _id: mockPaymentId,
    user: mockUserId,
    booking: mockBookingId,
    amount: 500000,
    currency: 'INR',
    razorpayOrderId: 'order_mock123',
    status: 'SUCCESS'
  };

  const generateCustomerToken = (userId = mockUserId) => {
    return jwt.sign({ id: userId, role: 'CUSTOMER' }, env.JWT_SECRET, { expiresIn: '15m' });
  };

  const generateAdminToken = (adminId = mockAdminId) => {
    return jwt.sign({ id: adminId, role: 'ADMIN' }, env.JWT_SECRET, { expiresIn: '15m' });
  };

  const generateCalendlySignature = (bodyString, secret, timestamp) => {
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${bodyString}`)
      .digest('hex');
    return `t=${timestamp},v1=${signature}`;
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(ProcessedWebhookEvent, 'deleteOne').mockResolvedValue({});
  });

  describe('POST /api/webhooks/calendly (Authenticity & Signature Checks)', () => {
    it('should reject webhook requests without signature header', async () => {
      const res = await request(app)
        .post('/api/webhooks/calendly')
        .send({ event: 'invitee.created' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('signature header missing');
    });

    it('should reject webhook requests with invalid cryptographic signature', async () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const res = await request(app)
        .post('/api/webhooks/calendly')
        .set('calendly-webhook-signature', `t=${timestamp},v1=invalidsig`)
        .send({ event: 'invitee.created' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('signature verification failed');
    });

    it('should reject webhook requests with large timestamp drift (replay protection)', async () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
      const body = { event: 'invitee.created' };
      const bodyString = JSON.stringify(body);
      const signature = generateCalendlySignature(bodyString, env.CALENDLY_WEBHOOK_SECRET, oldTimestamp);

      const res = await request(app)
        .post('/api/webhooks/calendly')
        .set('calendly-webhook-signature', signature)
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('timestamp drift is too large');
    });
  });

  describe('POST /api/webhooks/calendly (invitee.created - Booking Confirmation Flow)', () => {
    it('should successfully confirm a booking on valid invitee.created with correct tracking campaign reference', async () => {
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({});
      jest.spyOn(Booking, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBookingDoc)
      });
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPaymentDoc);
      const saveSpy = jest.spyOn(mockBookingDoc, 'save');

      const webhookPayload = {
        event: 'invitee.created',
        payload: {
          email: 'customer@example.com',
          event: 'https://api.calendly.com/scheduled_events/event_123',
          uri: 'https://api.calendly.com/scheduled_events/event_123/invitees/invitee_456',
          tracking: {
            utm_campaign: mockBookingRef
          },
          start_time: '2026-07-10T10:00:00.000Z'
        }
      };

      const bodyString = JSON.stringify(webhookPayload);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateCalendlySignature(bodyString, env.CALENDLY_WEBHOOK_SECRET, timestamp);

      const res = await request(app)
        .post('/api/webhooks/calendly')
        .set('calendly-webhook-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockBookingDoc.status).toBe('CONFIRMED');
      expect(mockBookingDoc.calendlyEventId).toBe('event_123');
      expect(mockBookingDoc.scheduledTime).toEqual(new Date('2026-07-10T10:00:00.000Z'));
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should reject booking and set status to CANCELLED if payment status is unpaid (verified paid status required)', async () => {
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({});
      
      const mockPendingDoc = { ...mockBookingDoc, status: 'PENDING', save: jest.fn().mockImplementation(function () { return Promise.resolve(this); }) };
      jest.spyOn(Booking, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPendingDoc)
      });
      // No successful payment found
      jest.spyOn(Payment, 'findOne').mockResolvedValue(null);
      const saveSpy = jest.spyOn(mockPendingDoc, 'save');

      const webhookPayload = {
        event: 'invitee.created',
        payload: {
          email: 'customer@example.com',
          event: 'https://api.calendly.com/scheduled_events/event_123',
          uri: 'https://api.calendly.com/scheduled_events/event_123/invitees/invitee_456',
          tracking: {
            utm_campaign: mockBookingRef
          }
        }
      };

      const bodyString = JSON.stringify(webhookPayload);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateCalendlySignature(bodyString, env.CALENDLY_WEBHOOK_SECRET, timestamp);

      const res = await request(app)
        .post('/api/webhooks/calendly')
        .set('calendly-webhook-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Unpaid booking attempt');
      expect(mockPendingDoc.status).toBe('CANCELLED');
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should reject booking with 403 if invitee email does not match customer booking owner (wrong customer check)', async () => {
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({});
      
      const mockUnmatchedDoc = { ...mockBookingDoc, user: { _id: mockUserId, email: 'customer@example.com' } };
      jest.spyOn(Booking, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUnmatchedDoc)
      });
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPaymentDoc);

      const webhookPayload = {
        event: 'invitee.created',
        payload: {
          email: 'attacker@example.com', // Wrong email
          event: 'https://api.calendly.com/scheduled_events/event_123',
          uri: 'https://api.calendly.com/scheduled_events/event_123/invitees/invitee_456',
          tracking: {
            utm_campaign: mockBookingRef
          }
        }
      };

      const bodyString = JSON.stringify(webhookPayload);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateCalendlySignature(bodyString, env.CALENDLY_WEBHOOK_SECRET, timestamp);

      const res = await request(app)
        .post('/api/webhooks/calendly')
        .set('calendly-webhook-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Invitee email does not match booking customer');
    });

    it('should fall back to customer email if tracking reference is missing (safe fallback unambiguous)', async () => {
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({});
      jest.spyOn(User, 'findOne').mockResolvedValue(mockCustomerUser);
      // Exactly one pending, paid booking
      const mockPendingDoc = { ...mockBookingDoc, status: 'PENDING', save: jest.fn().mockImplementation(function () { return Promise.resolve(this); }) };
      jest.spyOn(Booking, 'find').mockResolvedValue([mockPendingDoc]);
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPaymentDoc);
      const saveSpy = jest.spyOn(mockPendingDoc, 'save');

      const webhookPayload = {
        event: 'invitee.created',
        payload: {
          email: 'customer@example.com',
          event: 'https://api.calendly.com/scheduled_events/event_123',
          uri: 'https://api.calendly.com/scheduled_events/event_123/invitees/invitee_456',
          tracking: {} // Missing campaign reference
        }
      };

      const bodyString = JSON.stringify(webhookPayload);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateCalendlySignature(bodyString, env.CALENDLY_WEBHOOK_SECRET, timestamp);

      const res = await request(app)
        .post('/api/webhooks/calendly')
        .set('calendly-webhook-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(mockPendingDoc.status).toBe('CONFIRMED');
      expect(mockPendingDoc.calendlyEventId).toBe('event_123');
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should set all pending paid bookings to NEEDS_REVIEW if fallback is ambiguous (multiple paid pending bookings)', async () => {
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({});
      jest.spyOn(User, 'findOne').mockResolvedValue(mockCustomerUser);

      // Multiple pending bookings
      const mockPendingDoc1 = { ...mockBookingDoc, status: 'PENDING', save: jest.fn().mockResolvedValue({}) };
      const mockPendingDoc2 = { ...mockBookingDoc, _id: new mongoose.Types.ObjectId().toString(), status: 'PENDING', save: jest.fn().mockResolvedValue({}) };
      jest.spyOn(Booking, 'find').mockResolvedValue([mockPendingDoc1, mockPendingDoc2]);
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPaymentDoc);

      const saveSpy1 = jest.spyOn(mockPendingDoc1, 'save');
      const saveSpy2 = jest.spyOn(mockPendingDoc2, 'save');

      const webhookPayload = {
        event: 'invitee.created',
        payload: {
          email: 'customer@example.com',
          event: 'https://api.calendly.com/scheduled_events/event_123',
          uri: 'https://api.calendly.com/scheduled_events/event_123/invitees/invitee_456',
          tracking: {}
        }
      };

      const bodyString = JSON.stringify(webhookPayload);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateCalendlySignature(bodyString, env.CALENDLY_WEBHOOK_SECRET, timestamp);

      const res = await request(app)
        .post('/api/webhooks/calendly')
        .set('calendly-webhook-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Ambiguous bookings detected');
      expect(mockPendingDoc1.status).toBe('NEEDS_REVIEW');
      expect(mockPendingDoc2.status).toBe('NEEDS_REVIEW');
      expect(saveSpy1).toHaveBeenCalled();
      expect(saveSpy2).toHaveBeenCalled();
    });

    it('should enforce idempotency and ignore duplicate webhook invitee.created events', async () => {
      const dbError = new Error('Duplicate key');
      dbError.code = 11000;
      jest.spyOn(ProcessedWebhookEvent, 'create').mockRejectedValue(dbError);

      const webhookPayload = {
        event: 'invitee.created',
        payload: {
          email: 'customer@example.com',
          event: 'https://api.calendly.com/scheduled_events/event_123',
          uri: 'https://api.calendly.com/scheduled_events/event_123/invitees/invitee_456'
        }
      };

      const bodyString = JSON.stringify(webhookPayload);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateCalendlySignature(bodyString, env.CALENDLY_WEBHOOK_SECRET, timestamp);

      const res = await request(app)
        .post('/api/webhooks/calendly')
        .set('calendly-webhook-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Webhook already processed');
    });

    it('should successfully match a paid, confirmed booking (without calendlyEventId) via email fallback', async () => {
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({});
      jest.spyOn(User, 'findOne').mockResolvedValue(mockCustomerUser);
      const mockConfirmedDoc = { ...mockBookingDoc, status: 'CONFIRMED', calendlyEventId: null, save: jest.fn().mockImplementation(function () { return Promise.resolve(this); }) };
      jest.spyOn(Booking, 'find').mockResolvedValue([mockConfirmedDoc]);
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPaymentDoc);
      const saveSpy = jest.spyOn(mockConfirmedDoc, 'save');

      const webhookPayload = {
        event: 'invitee.created',
        payload: {
          email: 'customer@example.com',
          event: 'https://api.calendly.com/scheduled_events/event_123',
          uri: 'https://api.calendly.com/scheduled_events/event_123/invitees/invitee_456',
          tracking: {}
        }
      };

      const bodyString = JSON.stringify(webhookPayload);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateCalendlySignature(bodyString, env.CALENDLY_WEBHOOK_SECRET, timestamp);

      const res = await request(app)
        .post('/api/webhooks/calendly')
        .set('calendly-webhook-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(mockConfirmedDoc.status).toBe('CONFIRMED');
      expect(mockConfirmedDoc.calendlyEventId).toBe('event_123');
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should reject scheduling attempt with 400 if the booking status is COMPLETED', async () => {
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({});
      const mockCompletedDoc = { ...mockBookingDoc, status: 'COMPLETED' };
      jest.spyOn(Booking, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCompletedDoc)
      });
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPaymentDoc);

      const webhookPayload = {
        event: 'invitee.created',
        payload: {
          email: 'customer@example.com',
          event: 'https://api.calendly.com/scheduled_events/event_123',
          uri: 'https://api.calendly.com/scheduled_events/event_123/invitees/invitee_456',
          tracking: {
            utm_campaign: mockBookingRef
          }
        }
      };

      const bodyString = JSON.stringify(webhookPayload);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateCalendlySignature(bodyString, env.CALENDLY_WEBHOOK_SECRET, timestamp);

      const res = await request(app)
        .post('/api/webhooks/calendly')
        .set('calendly-webhook-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Booking is already completed');
    });
  });

  describe('POST /api/webhooks/calendly (invitee.canceled & reschedule)', () => {
    it('should transition booking to CANCELLED on invitee.canceled webhook event', async () => {
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({});
      
      const mockConfirmedBooking = { ...mockBookingDoc, status: 'CONFIRMED', calendlyEventId: 'event_123' };
      jest.spyOn(Booking, 'findOne').mockResolvedValue(mockConfirmedBooking);
      const saveSpy = jest.spyOn(mockConfirmedBooking, 'save');

      const webhookPayload = {
        event: 'invitee.canceled',
        payload: {
          email: 'customer@example.com',
          event: 'https://api.calendly.com/scheduled_events/event_123',
          uri: 'https://api.calendly.com/scheduled_events/event_123/invitees/invitee_456'
        }
      };

      const bodyString = JSON.stringify(webhookPayload);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateCalendlySignature(bodyString, env.CALENDLY_WEBHOOK_SECRET, timestamp);

      const res = await request(app)
        .post('/api/webhooks/calendly')
        .set('calendly-webhook-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockConfirmedBooking.status).toBe('CANCELLED');
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should successfully handle reschedule slot update by transitioning booking from CANCELLED to CONFIRMED on new invitee.created', async () => {
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({});
      
      // Booking is currently CANCELLED due to old cancellation
      const mockCancelledBooking = { ...mockBookingDoc, status: 'CANCELLED' };
      jest.spyOn(Booking, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCancelledBooking)
      });
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPaymentDoc);
      const saveSpy = jest.spyOn(mockCancelledBooking, 'save');

      const webhookPayload = {
        event: 'invitee.created',
        payload: {
          email: 'customer@example.com',
          event: 'https://api.calendly.com/scheduled_events/event_new123',
          uri: 'https://api.calendly.com/scheduled_events/event_new123/invitees/invitee_new456',
          tracking: {
            utm_campaign: mockBookingRef
          },
          start_time: '2026-07-15T14:00:00.000Z'
        }
      };

      const bodyString = JSON.stringify(webhookPayload);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateCalendlySignature(bodyString, env.CALENDLY_WEBHOOK_SECRET, timestamp);

      const res = await request(app)
        .post('/api/webhooks/calendly')
        .set('calendly-webhook-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(mockCancelledBooking.status).toBe('CONFIRMED');
      expect(mockCancelledBooking.calendlyEventId).toBe('event_new123');
      expect(mockCancelledBooking.scheduledTime).toEqual(new Date('2026-07-15T14:00:00.000Z'));
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('Customer Bookings Retrieve APIs (GET /api/me/bookings)', () => {
    it('should retrieve customer bookings list and unlock Calendly booking URL only when payment is successful', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      
      // Mock two bookings: one paid, one unpaid
      const mockPaidBooking = { ...mockBookingDoc, _id: 'paid_booking_123', status: 'PENDING', toObject: function() { return this; } };
      const mockUnpaidBooking = { ...mockBookingDoc, _id: 'unpaid_booking_456', status: 'PENDING', toObject: function() { return this; } };
      
      const mockFindChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockPaidBooking, mockUnpaidBooking])
      };
      jest.spyOn(Booking, 'find').mockReturnValue(mockFindChain);
      
      // Payment mock: first call SUCCESS, second call PENDING/null
      const paymentSpy = jest.spyOn(Payment, 'findOne')
        .mockResolvedValueOnce(mockPaymentDoc)
        .mockResolvedValueOnce(null);

      const customerToken = generateCustomerToken();

      const res = await request(app)
        .get('/api/me/bookings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.bookings).toHaveLength(2);
      expect(res.body.bookings[0].paymentStatus).toBe('SUCCESS');
      expect(res.body.bookings[0].unlockedCalendlyUrl).toContain('utm_campaign=');
      expect(res.body.bookings[1].paymentStatus).toBe('PENDING');
      expect(res.body.bookings[1].unlockedCalendlyUrl).toBeNull();
    });

    it('should retrieve a specific customer booking by ID enforcing ownership check', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      
      const mockBooking = { ...mockBookingDoc, user: mockUserId, toObject: function() { return this; } };
      jest.spyOn(Booking, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBooking)
      });
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPaymentDoc);

      const customerToken = generateCustomerToken();

      const res = await request(app)
        .get(`/api/me/bookings/${mockBookingId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.booking.paymentStatus).toBe('SUCCESS');
      expect(res.body.booking.unlockedCalendlyUrl).toContain('utm_campaign=');
    });

    it('should reject specific booking retrieval if not owned by the authenticated customer (IDOR prevention)', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      
      // Booking owned by other user
      const mockBooking = { ...mockBookingDoc, user: mockOtherUserId, toObject: function() { return this; } };
      jest.spyOn(Booking, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBooking)
      });

      const customerToken = generateCustomerToken();

      const res = await request(app)
        .get(`/api/me/bookings/${mockBookingId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('ownership validation failed');
    });

    it('should suppress unlockedCalendlyUrl for past or COMPLETED bookings', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);

      const pastTime = new Date(Date.now() - 3600 * 1000); // 1 hour ago
      const mockPastBooking = { ...mockBookingDoc, _id: 'past_booking_123', status: 'CONFIRMED', scheduledTime: pastTime, toObject: function() { return this; } };
      const mockCompletedBooking = { ...mockBookingDoc, _id: 'completed_booking_456', status: 'COMPLETED', scheduledTime: null, toObject: function() { return this; } };

      const mockFindChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockPastBooking, mockCompletedBooking])
      };
      jest.spyOn(Booking, 'find').mockReturnValue(mockFindChain);
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPaymentDoc);

      const customerToken = generateCustomerToken();

      const res = await request(app)
        .get('/api/me/bookings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.bookings).toHaveLength(2);
      expect(res.body.bookings[0].unlockedCalendlyUrl).toBeNull();
      expect(res.body.bookings[1].unlockedCalendlyUrl).toBeNull();
    });
  });

  describe('Admin Bookings Retrieve APIs (GET /api/admin/bookings)', () => {
    it('should allow admin to list all bookings with pagination and NoSQL sanitization', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);

      const mockFindChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ ...mockBookingDoc, toObject: function() { return this; } }])
      };
      
      jest.spyOn(Booking, 'countDocuments').mockResolvedValue(1);
      const findSpy = jest.spyOn(Booking, 'find').mockReturnValue(mockFindChain);
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPaymentDoc);

      const adminToken = generateAdminToken();

      const res = await request(app)
        .get('/api/admin/bookings?page=1&limit=10&status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.bookings).toHaveLength(1);
      expect(findSpy).toHaveBeenCalledWith({ status: 'PENDING' });
    });
  });
});
