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

describe('Razorpay Payment Integration Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockOtherUserId = new mongoose.Types.ObjectId().toString();
  const mockAdminId = new mongoose.Types.ObjectId().toString();
  
  const mockServiceId = new mongoose.Types.ObjectId().toString();
  const mockBookingId = new mongoose.Types.ObjectId().toString();
  const mockPaymentId = new mongoose.Types.ObjectId().toString();
  const mockOrderId = 'order_mockOrderId123';

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
    price: 5000, // 5000 INR
    calendlyUrl: 'https://calendly.com/consultant/1h',
    isActive: true
  };

  const mockBookingDoc = {
    _id: mockBookingId,
    user: mockUserId,
    service: mockServiceId,
    status: 'PENDING',
    bookingReference: 'booking_opaqueRef123',
    save: jest.fn().mockImplementation(function () { return Promise.resolve(this); })
  };

  const mockPaymentDoc = {
    _id: mockPaymentId,
    user: mockUserId,
    booking: mockBookingDoc,
    amount: 500000, // in paise
    currency: 'INR',
    razorpayOrderId: mockOrderId,
    status: 'PENDING',
    save: jest.fn().mockImplementation(function () { return Promise.resolve(this); })
  };

  // JWT helper generators
  const generateCustomerToken = (userId = mockUserId) => {
    return jwt.sign({ id: userId, role: 'CUSTOMER' }, env.JWT_SECRET, { expiresIn: '15m' });
  };

  const generateAdminToken = (adminId = mockAdminId) => {
    return jwt.sign({ id: adminId, role: 'ADMIN' }, env.JWT_SECRET, { expiresIn: '15m' });
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(ProcessedWebhookEvent, 'deleteOne').mockResolvedValue({});
  });

  describe('POST /api/payments/create-order (Order creation, Tampering, Spoofing checks)', () => {
    it('should successfully create a pending order and booking with authoritative server-side pricing', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      jest.spyOn(Service, 'findOne').mockResolvedValue(mockServiceDoc);
      
      const bookingSpy = jest.spyOn(Booking, 'create').mockResolvedValue(mockBookingDoc);
      const paymentSpy = jest.spyOn(Payment, 'create').mockResolvedValue(mockPaymentDoc);

      const customerToken = generateCustomerToken();

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ serviceId: 'consulting-1h' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('orderId');
      expect(res.body.amount).toBe(500000); // 5000 INR * 100 in paise
      expect(res.body.currency).toBe('INR');
      expect(res.body.bookingReference).toContain('booking_');
      expect(res.body.keyId).toBe(env.RAZORPAY_KEY_ID);

      // Verify server-side pricing (not client-defined amount) and strict ownership mapping
      expect(bookingSpy).toHaveBeenCalledWith(expect.objectContaining({
        user: mockUserId,
        service: mockServiceId,
        status: 'PENDING'
      }));
      expect(paymentSpy).toHaveBeenCalledWith(expect.objectContaining({
        user: mockUserId,
        amount: 500000,
        currency: 'INR',
        status: 'PENDING'
      }));
    });

    it('should ignore client-submitted amount parameter (Amount Tampering protection)', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      jest.spyOn(Service, 'findOne').mockResolvedValue(mockServiceDoc);
      
      jest.spyOn(Booking, 'create').mockResolvedValue(mockBookingDoc);
      const paymentSpy = jest.spyOn(Payment, 'create').mockResolvedValue(mockPaymentDoc);

      const customerToken = generateCustomerToken();

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ 
          serviceId: 'consulting-1h',
          amount: 100 // Tampered amount (1 INR)
        });

      expect(res.status).toBe(201);
      // Backend must calculate the authoritative price (500000 paise) ignoring client's amount input
      expect(res.body.amount).toBe(500000);
      expect(paymentSpy).toHaveBeenCalledWith(expect.objectContaining({
        amount: 500000 // authoritative price
      }));
    });

    it('should ignore client-submitted customerId parameters (Fake Customer ID spoofing protection)', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      jest.spyOn(Service, 'findOne').mockResolvedValue(mockServiceDoc);
      
      const bookingSpy = jest.spyOn(Booking, 'create').mockResolvedValue(mockBookingDoc);
      jest.spyOn(Payment, 'create').mockResolvedValue(mockPaymentDoc);

      const customerToken = generateCustomerToken();

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ 
          serviceId: 'consulting-1h',
          userId: mockOtherUserId, // Attempt to spoof customer ID
          customerId: mockOtherUserId // Attempt to spoof customer ID
        });

      expect(res.status).toBe(201);
      // Ownership must map to the token user (mockUserId) rather than the body params
      expect(bookingSpy).toHaveBeenCalledWith(expect.objectContaining({
        user: mockUserId
      }));
    });

    it('should reject order creation if service is not found', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      jest.spyOn(Service, 'findOne').mockResolvedValue(null);

      const customerToken = generateCustomerToken();

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ serviceId: 'nonexistent-service' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Service not found');
    });

    it('should reject order creation if service is inactive', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      const inactiveService = { ...mockServiceDoc, isActive: false };
      jest.spyOn(Service, 'findOne').mockResolvedValue(inactiveService);

      const customerToken = generateCustomerToken();

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ serviceId: 'consulting-1h' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Service is currently inactive');
    });

    it('should rate limit order creation requests exceeding the threshold', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      jest.spyOn(Service, 'findOne').mockResolvedValue(mockServiceDoc);
      jest.spyOn(Booking, 'create').mockResolvedValue(mockBookingDoc);
      jest.spyOn(Payment, 'create').mockResolvedValue(mockPaymentDoc);

      const customerToken = generateCustomerToken();

      // Send 15 creations
      for (let i = 0; i < 15; i++) {
        await request(app)
          .post('/api/payments/create-order')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ serviceId: 'consulting-1h' });
      }

      // 16th request should fail with 429
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ serviceId: 'consulting-1h' });

      expect(res.status).toBe(429);
      expect(res.body.message).toContain('Too many payment orders initiated');
    });
  });

  describe('POST /api/payments/verify (Payment verification & ownership boundary checks)', () => {
    const validPaymentId = 'pay_verifiedId456';
    const generateMockSignature = (orderId, paymentId) => {
      return crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    };

    it('should successfully verify payment and transition booking to CONFIRMED on correct signature', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      
      const mockPayment = { ...mockPaymentDoc, status: 'PENDING' };
      jest.spyOn(Payment, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPayment)
      });
      const paymentUpdateSpy = jest.spyOn(Payment, 'findOneAndUpdate').mockResolvedValue(mockPayment);
      const bookingSpy = jest.spyOn(Booking, 'findByIdAndUpdate').mockResolvedValue(mockBookingDoc);

      const customerToken = generateCustomerToken();
      const validSignature = generateMockSignature(mockOrderId, validPaymentId);

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          razorpay_order_id: mockOrderId,
          razorpay_payment_id: validPaymentId,
          razorpay_signature: validSignature
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(paymentUpdateSpy).toHaveBeenCalledWith(
        { razorpayOrderId: mockOrderId, status: 'PENDING' },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'SUCCESS',
            razorpayPaymentId: validPaymentId,
            razorpaySignature: validSignature
          })
        }),
        { new: true }
      );
      expect(bookingSpy).toHaveBeenCalledWith(mockBookingDoc, { $set: { status: 'CONFIRMED' } });
    });

    it('should reject verification and set payment to FAILED and booking to CANCELLED on invalid signature', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      
      const mockPayment = { ...mockPaymentDoc, status: 'PENDING' };
      jest.spyOn(Payment, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPayment)
      });
      const paymentUpdateSpy = jest.spyOn(Payment, 'findOneAndUpdate').mockResolvedValue(mockPayment);
      const bookingSpy = jest.spyOn(Booking, 'findByIdAndUpdate').mockResolvedValue(mockBookingDoc);

      const customerToken = generateCustomerToken();

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          razorpay_order_id: mockOrderId,
          razorpay_payment_id: validPaymentId,
          razorpay_signature: 'invalid_signature_string'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('signature verification failed');
      expect(paymentUpdateSpy).toHaveBeenCalledWith(
        { razorpayOrderId: mockOrderId, status: 'PENDING' },
        { $set: { status: 'FAILED' } },
        { new: true }
      );
      expect(bookingSpy).toHaveBeenCalledWith(mockBookingDoc, { $set: { status: 'CANCELLED' } });
    });

    it('should prevent a customer from verifying another customer\'s payment (Ownership validation)', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      
      // Payment belongs to mockOtherUserId
      const mockPayment = { ...mockPaymentDoc, user: mockOtherUserId };
      jest.spyOn(Payment, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPayment)
      });

      const customerToken = generateCustomerToken(); // Token for mockUserId
      const signature = generateMockSignature(mockOrderId, validPaymentId);

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          razorpay_order_id: mockOrderId,
          razorpay_payment_id: validPaymentId,
          razorpay_signature: signature
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('ownership verification failed');
    });

    it('should support idempotent verification on replayed verify calls without throwing errors', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      
      // Payment is already marked as SUCCESS
      const mockPayment = { ...mockPaymentDoc, status: 'SUCCESS' };
      jest.spyOn(Payment, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPayment)
      });

      const customerToken = generateCustomerToken();
      const signature = generateMockSignature(mockOrderId, validPaymentId);

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          razorpay_order_id: mockOrderId,
          razorpay_payment_id: validPaymentId,
          razorpay_signature: signature
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('already processed');
    });

    it('should reject verification if payment status is FAILED', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      
      // Payment is already marked as FAILED
      const mockPayment = { ...mockPaymentDoc, status: 'FAILED' };
      jest.spyOn(Payment, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPayment)
      });

      const customerToken = generateCustomerToken();
      const signature = generateMockSignature(mockOrderId, validPaymentId);

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          razorpay_order_id: mockOrderId,
          razorpay_payment_id: validPaymentId,
          razorpay_signature: signature
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not in a pending state');
    });
  });

  describe('POST /api/webhooks/razorpay (Reconciliation, Raw Body signature verification, Idempotency checks)', () => {
    const generateWebhookHeaderSignature = (bodyString, secret) => {
      return crypto
        .createHmac('sha256', secret)
        .update(bodyString)
        .digest('hex');
    };

    it('should successfully reconcile missed client payment verification via webhook (payment.captured event)', async () => {
      const mockPayment = { ...mockPaymentDoc, status: 'PENDING' };
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPayment);
      jest.spyOn(Payment, 'findOneAndUpdate').mockResolvedValue(mockPayment);
      const bookingSpy = jest.spyOn(Booking, 'findByIdAndUpdate').mockResolvedValue(mockBookingDoc);
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({ eventId: 'evt_999' });

      const webhookPayload = {
        event: 'payment.captured',
        event_id: 'evt_999',
        payload: {
          payment: {
            entity: {
              id: 'pay_capturedId123',
              order_id: mockOrderId,
              amount: 500000,
              currency: 'INR'
            }
          }
        }
      };

      const rawBodyString = JSON.stringify(webhookPayload);
      const signature = generateWebhookHeaderSignature(rawBodyString, env.RAZORPAY_WEBHOOK_SECRET);

      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(bookingSpy).toHaveBeenCalledWith(mockBookingDoc, { $set: { status: 'CONFIRMED' } }, { new: true });
    });

    it('should reject webhook requests with invalid cryptographic signatures', async () => {
      const webhookPayload = {
        event: 'payment.captured',
        event_id: 'evt_999'
      };

      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', 'invalid_webhook_signature')
        .send(webhookPayload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('signature verification failed');
    });

    it('should enforce idempotency and safely return 200 without processing duplicate events', async () => {
      // ProcessedWebhookEvent.create throws E11000 duplicate key error
      const mongoError = new Error('Duplicate key');
      mongoError.code = 11000;
      jest.spyOn(ProcessedWebhookEvent, 'create').mockRejectedValue(mongoError);
      
      const paymentSpy = jest.spyOn(Payment, 'findOne');

      const webhookPayload = {
        event: 'payment.captured',
        event_id: 'evt_duplicate',
        payload: {
          payment: {
            entity: {
              id: 'pay_capturedId123',
              order_id: mockOrderId
            }
          }
        }
      };

      const rawBodyString = JSON.stringify(webhookPayload);
      const signature = generateWebhookHeaderSignature(rawBodyString, env.RAZORPAY_WEBHOOK_SECRET);

      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('already processed');
      expect(paymentSpy).not.toHaveBeenCalled();
    });

    it('should process payment.failed webhook event and transition booking to CANCELLED', async () => {
      const mockPayment = { ...mockPaymentDoc, status: 'PENDING' };
      jest.spyOn(Payment, 'findOneAndUpdate').mockResolvedValue(mockPayment);
      const bookingSpy = jest.spyOn(Booking, 'findByIdAndUpdate').mockResolvedValue(mockBookingDoc);
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({ eventId: 'evt_failed' });

      const webhookPayload = {
        event: 'payment.failed',
        event_id: 'evt_failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_failedId123',
              order_id: mockOrderId
            }
          }
        }
      };

      const rawBodyString = JSON.stringify(webhookPayload);
      const signature = generateWebhookHeaderSignature(rawBodyString, env.RAZORPAY_WEBHOOK_SECRET);

      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(bookingSpy).toHaveBeenCalledWith(mockBookingDoc, { $set: { status: 'CANCELLED' } });
    });

    it('should process refund.processed webhook event and transition booking to CANCELLED and payment to REFUNDED', async () => {
      const mockPayment = { ...mockPaymentDoc, status: 'SUCCESS', razorpayOrderId: mockOrderId };
      const paymentUpdateSpy = jest.spyOn(Payment, 'findOneAndUpdate').mockResolvedValue(mockPayment);
      const bookingSpy = jest.spyOn(Booking, 'findByIdAndUpdate').mockResolvedValue(mockBookingDoc);
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({ eventId: 'evt_refunded' });

      const webhookPayload = {
        event: 'refund.processed',
        event_id: 'evt_refunded',
        payload: {
          refund: {
            entity: {
              id: 'rfnd_Id123',
              payment_id: 'pay_capturedId123'
            }
          }
        }
      };

      const rawBodyString = JSON.stringify(webhookPayload);
      const signature = generateWebhookHeaderSignature(rawBodyString, env.RAZORPAY_WEBHOOK_SECRET);

      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(paymentUpdateSpy).toHaveBeenCalledWith(
        { razorpayPaymentId: 'pay_capturedId123', status: 'SUCCESS' },
        { $set: { status: 'REFUNDED' } },
        { new: true }
      );
      expect(bookingSpy).toHaveBeenCalledWith(mockBookingDoc, { $set: { status: 'CANCELLED' } });
    });

    it('should reject webhook reconciliation if amount or currency is tampered', async () => {
      const mockPayment = { ...mockPaymentDoc, status: 'PENDING' };
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPayment);
      const paymentUpdateSpy = jest.spyOn(Payment, 'findOneAndUpdate');
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({ eventId: 'evt_tampered' });

      const webhookPayload = {
        event: 'payment.captured',
        event_id: 'evt_tampered',
        payload: {
          payment: {
            entity: {
              id: 'pay_capturedId123',
              order_id: mockOrderId,
              amount: 1000, // Expected 500000
              currency: 'INR'
            }
          }
        }
      };

      const rawBodyString = JSON.stringify(webhookPayload);
      const signature = generateWebhookHeaderSignature(rawBodyString, env.RAZORPAY_WEBHOOK_SECRET);

      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('amount or currency mismatch');
      expect(paymentUpdateSpy).not.toHaveBeenCalled();
    });

    it('should delete ProcessedWebhookEvent if business logic fails during webhook handling', async () => {
      // Payment findOne throws an error
      jest.spyOn(Payment, 'findOne').mockRejectedValue(new Error('Database error'));
      const deleteSpy = jest.spyOn(ProcessedWebhookEvent, 'deleteOne').mockResolvedValue({});
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({ eventId: 'evt_failed_biz' });

      const webhookPayload = {
        event: 'payment.captured',
        event_id: 'evt_failed_biz',
        payload: {
          payment: {
            entity: {
              id: 'pay_capturedId123',
              order_id: mockOrderId,
              amount: 500000,
              currency: 'INR'
            }
          }
        }
      };

      const rawBodyString = JSON.stringify(webhookPayload);
      const signature = generateWebhookHeaderSignature(rawBodyString, env.RAZORPAY_WEBHOOK_SECRET);

      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(500);
      expect(deleteSpy).toHaveBeenCalledWith({ eventId: 'evt_failed_biz' });
    });
  });

  describe('Customer and Admin Payment Lookup Routes', () => {
    it('should allow customer to get their own payment records, rejecting unauthorized calls', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      
      const mockFindChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockPaymentDoc])
      };
      const findSpy = jest.spyOn(Payment, 'find').mockReturnValue(mockFindChain);

      const customerToken = generateCustomerToken();

      const res = await request(app)
        .get('/api/me/payments')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.payments).toHaveLength(1);
      expect(findSpy).toHaveBeenCalledWith({ user: mockUserId });
    });

    it('should prevent customer from accessing another customer\'s payment lookup (IDOR check)', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);

      // Payment belongs to mockOtherUserId
      const paymentObj = { ...mockPaymentDoc, user: mockOtherUserId };
      jest.spyOn(Payment, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue(paymentObj)
      });

      const customerToken = generateCustomerToken();

      const res = await request(app)
        .get(`/api/me/payments/${mockPaymentId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('payment ownership validation failed');
    });

    it('should allow Admin to search and paginate all payments', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
      const adminToken = generateAdminToken();

      const mockFindChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockPaymentDoc])
      };

      jest.spyOn(Payment, 'countDocuments').mockResolvedValue(1);
      const findSpy = jest.spyOn(Payment, 'find').mockReturnValue(mockFindChain);

      const res = await request(app)
        .get('/api/admin/payments?page=1&limit=10&status=SUCCESS')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(findSpy).toHaveBeenCalledWith({ status: 'SUCCESS' });
    });
  });
});
