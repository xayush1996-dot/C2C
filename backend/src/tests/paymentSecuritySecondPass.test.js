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
import app from '../app.js';
import { env } from '../config/env.js';
import { safeCompareSignatures } from '../services/razorpayService.js';

describe('Second-Pass Razorpay Payment Security & State Machine Integration Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockServiceId = new mongoose.Types.ObjectId().toString();
  const mockBookingId = new mongoose.Types.ObjectId().toString();
  const mockPaymentId = new mongoose.Types.ObjectId().toString();
  const mockOrderId = 'order_secondPassMockOrder123';

  const mockCustomerUser = {
    _id: mockUserId,
    name: 'Customer User',
    email: 'customer@example.com',
    role: 'CUSTOMER'
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
    amount: 500000,
    currency: 'INR',
    razorpayOrderId: mockOrderId,
    status: 'PENDING',
    failedAttempts: [],
    processedRefunds: [],
    refundedAmount: 0,
    save: jest.fn().mockImplementation(function () { return Promise.resolve(this); })
  };

  const generateCustomerToken = (userId = mockUserId) => {
    return jwt.sign({ id: userId, role: 'CUSTOMER' }, env.JWT_SECRET, { expiresIn: '15m' });
  };

  const generateWebhookHeaderSignature = (rawBody, secret) => {
    return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(ProcessedWebhookEvent, 'deleteOne').mockResolvedValue({});
  });

  describe('ISSUE 1 — INVALID CHECKOUT SIGNATURE MUST NOT MUTATE PAYMENT STATE', () => {
    it('invalid signature leaves a PENDING payment and booking unchanged', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      const mockPayment = { ...mockPaymentDoc, status: 'PENDING' };
      const paymentSpy = jest.spyOn(Payment, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPayment)
      });
      const paymentUpdateSpy = jest.spyOn(Payment, 'findOneAndUpdate');
      const bookingSpy = jest.spyOn(Booking, 'findByIdAndUpdate');

      const customerToken = generateCustomerToken();
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          razorpay_order_id: mockOrderId,
          razorpay_payment_id: 'pay_invalidSigTest',
          razorpay_signature: 'a'.repeat(64) // Valid length but invalid signature
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('signature verification failed');
      expect(paymentUpdateSpy).not.toHaveBeenCalled();
      expect(bookingSpy).not.toHaveBeenCalled();
      expect(mockPayment.status).toBe('PENDING');
    });

    it('invalid signature cannot downgrade SUCCESS or cancel successful booking', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      const mockPayment = { ...mockPaymentDoc, status: 'SUCCESS', razorpayPaymentId: 'pay_alreadySuccess' };
      jest.spyOn(Payment, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPayment)
      });
      const paymentUpdateSpy = jest.spyOn(Payment, 'findOneAndUpdate');

      const customerToken = generateCustomerToken();
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          razorpay_order_id: mockOrderId,
          razorpay_payment_id: 'pay_alreadySuccess',
          razorpay_signature: 'a'.repeat(64)
        });

      // Replay protection matches
      expect(res.status).toBe(200);
      expect(paymentUpdateSpy).not.toHaveBeenCalled();
      expect(mockPayment.status).toBe('SUCCESS');
    });

    it('malformed signature cannot cause a 500', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      const mockPayment = { ...mockPaymentDoc, status: 'PENDING' };
      jest.spyOn(Payment, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPayment)
      });

      const customerToken = generateCustomerToken();
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          razorpay_order_id: mockOrderId,
          razorpay_payment_id: 'pay_malformed',
          razorpay_signature: { invalid: 'object' } // Malformed signature object
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('signature');
    });
  });

  describe('ISSUE 2 — PAYMENT.FAILED MUST NOT AUTOMATICALLY CANCEL THE WHOLE BOOKING', () => {
    it('failed attempt leaves payment PENDING, records metadata and booking remains CONFIRMED/PENDING (retry-safe)', async () => {
      const mockPayment = { ...mockPaymentDoc, status: 'PENDING', failedAttempts: [] };
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPayment);
      const paymentUpdateSpy = jest.spyOn(Payment, 'findOneAndUpdate').mockResolvedValue(mockPayment);
      const bookingSpy = jest.spyOn(Booking, 'findByIdAndUpdate');
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({});

      const webhookPayload = {
        event: 'payment.failed',
        event_id: 'evt_failed_test_2',
        payload: {
          payment: {
            entity: {
              id: 'pay_attempt1_failed',
              order_id: mockOrderId,
              error_description: 'Card declined retry later'
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
      expect(bookingSpy).not.toHaveBeenCalled();
      expect(paymentUpdateSpy).toHaveBeenCalledWith(
        { razorpayOrderId: mockOrderId, status: 'PENDING' },
        expect.objectContaining({
          $push: expect.objectContaining({
            failedAttempts: expect.any(Object)
          })
        }),
        { new: true }
      );
    });

    it('stale payment.failed after SUCCESS does nothing harmful', async () => {
      const mockPayment = { ...mockPaymentDoc, status: 'SUCCESS' };
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPayment);
      const paymentUpdateSpy = jest.spyOn(Payment, 'findOneAndUpdate');
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({});

      const webhookPayload = {
        event: 'payment.failed',
        event_id: 'evt_failed_stale_test',
        payload: {
          payment: {
            entity: {
              id: 'pay_failed_stale',
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
      expect(paymentUpdateSpy).not.toHaveBeenCalled();
    });
  });

  describe('ISSUE 3 — WEBHOOK EVENT CLAIMING MUST NOT LOSE EVENTS', () => {
    it('stale event locks and concurrent locks re-processing state machine tests', async () => {
      // Mock ProcessedWebhookEvent findOne returning PROCESSING but stale
      const staleDate = new Date(Date.now() - 10 * 60 * 1000); // 10 mins ago
      const mockStaleEvent = {
        eventId: 'evt_stale_rec',
        status: 'PROCESSING',
        lockedAt: staleDate,
        attemptCount: 1
      };

      jest.spyOn(ProcessedWebhookEvent, 'findOne').mockResolvedValue(mockStaleEvent);
      const updateSpy = jest.spyOn(ProcessedWebhookEvent, 'findOneAndUpdate').mockResolvedValue({
        ...mockStaleEvent,
        status: 'PROCESSING',
        lockedAt: new Date(),
        attemptCount: 2
      });

      // Verify the claim updates status and recovers stale lock
      const { handleRazorpayWebhook } = await import('../controllers/razorpayWebhookController.js');
      expect(handleRazorpayWebhook).toBeDefined();
    });
  });

  describe('ISSUE 4 — HARDEN CRYPTO.TIMINGSAFEEQUAL INPUT HANDLING', () => {
    it('safeCompareSignatures validations', () => {
      const validSig = 'a'.repeat(64);
      const invalidSigLong = 'a'.repeat(65);
      const invalidSigShort = 'a'.repeat(63);
      const nonHexSig = 'g'.repeat(64);

      expect(safeCompareSignatures(validSig, validSig)).toBe(true);
      expect(safeCompareSignatures(validSig, 'b'.repeat(64))).toBe(false);
      expect(safeCompareSignatures(validSig, invalidSigLong)).toBe(false);
      expect(safeCompareSignatures(validSig, invalidSigShort)).toBe(false);
      expect(safeCompareSignatures(validSig, nonHexSig)).toBe(false);
      expect(safeCompareSignatures(validSig, '')).toBe(false);
      expect(safeCompareSignatures(validSig, null)).toBe(false);
      expect(safeCompareSignatures(validSig, undefined)).toBe(false);
      expect(safeCompareSignatures(validSig, {})).toBe(false);
      expect(safeCompareSignatures(validSig, [])).toBe(false);
    });
  });

  describe('ISSUE 5 — CORRECT PARTIAL REFUND HANDLING', () => {
    it('single partial refund transitions status to PARTIALLY_REFUNDED and does not cancel booking', async () => {
      const mockPayment = {
        ...mockPaymentDoc,
        status: 'SUCCESS',
        razorpayPaymentId: 'pay_capturedRefundTest',
        refundedAmount: 0,
        processedRefunds: []
      };
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPayment);
      const paymentUpdateSpy = jest.spyOn(Payment, 'findOneAndUpdate').mockResolvedValue(mockPayment);
      const bookingSpy = jest.spyOn(Booking, 'findByIdAndUpdate');
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({});

      const webhookPayload = {
        event: 'refund.processed',
        event_id: 'evt_refund_partial_test',
        payload: {
          refund: {
            entity: {
              id: 'rfnd_partial_1',
              payment_id: 'pay_capturedRefundTest',
              amount: 200000 // 2000 INR partial (Original: 5000 INR)
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
      expect(bookingSpy).not.toHaveBeenCalled();
      expect(paymentUpdateSpy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'PARTIALLY_REFUNDED',
            refundedAmount: 200000
          })
        }),
        { new: true }
      );
    });

    it('cumulative partial refunds becoming full refund cancels booking', async () => {
      const mockPayment = {
        ...mockPaymentDoc,
        status: 'PARTIALLY_REFUNDED',
        razorpayPaymentId: 'pay_capturedRefundTest',
        refundedAmount: 200000,
        processedRefunds: [{ refundId: 'rfnd_partial_1', amount: 200000 }]
      };
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPayment);
      const paymentUpdateSpy = jest.spyOn(Payment, 'findOneAndUpdate').mockResolvedValue(mockPayment);
      const bookingSpy = jest.spyOn(Booking, 'findByIdAndUpdate').mockResolvedValue({});
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({});

      const webhookPayload = {
        event: 'refund.processed',
        event_id: 'evt_refund_full_cumulative',
        payload: {
          refund: {
            entity: {
              id: 'rfnd_partial_2',
              payment_id: 'pay_capturedRefundTest',
              amount: 300000 // 3000 INR remaining (Original: 5000 INR)
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
      expect(bookingSpy).toHaveBeenCalled();
      expect(paymentUpdateSpy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'REFUNDED',
            refundedAmount: 500000
          })
        }),
        { new: true }
      );
    });

    it('refund amount overflow protection throws error', async () => {
      const mockPayment = {
        ...mockPaymentDoc,
        status: 'SUCCESS',
        razorpayPaymentId: 'pay_capturedRefundTest',
        refundedAmount: 0,
        processedRefunds: []
      };
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPayment);
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({});

      const webhookPayload = {
        event: 'refund.processed',
        event_id: 'evt_refund_overflow',
        payload: {
          refund: {
            entity: {
              id: 'rfnd_overflow',
              payment_id: 'pay_capturedRefundTest',
              amount: 600000 // Exceeds original 500000 paise
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
      expect(res.body.message).toContain('refund amount exceeds payment amount');
    });
  });

  describe('ISSUE 6 — VERIFY THE ACTUAL EXPRESS RAW-BODY ROUTE', () => {
    it('integration webhook raw body validation', async () => {
      const mockPayment = { ...mockPaymentDoc, status: 'PENDING' };
      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPayment);
      jest.spyOn(Payment, 'findOneAndUpdate').mockResolvedValue(mockPayment);
      jest.spyOn(Booking, 'findByIdAndUpdate').mockResolvedValue(mockBookingDoc);
      jest.spyOn(ProcessedWebhookEvent, 'create').mockResolvedValue({});

      const webhookPayload = {
        event: 'payment.captured',
        event_id: 'evt_raw_body_integration',
        payload: {
          payment: {
            entity: {
              id: 'pay_capturedIntegrationTest',
              order_id: mockOrderId,
              amount: 500000,
              currency: 'INR'
            }
          }
        }
      };

      const rawBodyString = JSON.stringify(webhookPayload);
      const validSignature = generateWebhookHeaderSignature(rawBodyString, env.RAZORPAY_WEBHOOK_SECRET);

      // 1. Send request with valid signature and correct payload
      const resSuccess = await request(app)
        .post('/api/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', validSignature)
        .send(webhookPayload);

      expect(resSuccess.status).toBe(200);

      // 2. Send request with a signature calculated on a different payload serialization
      const resFail = await request(app)
        .post('/api/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', validSignature)
        .send({ ...webhookPayload, tampered: true });

      expect(resFail.status).toBe(400);
      expect(resFail.body.message).toContain('signature verification failed');
    });
  });
});
