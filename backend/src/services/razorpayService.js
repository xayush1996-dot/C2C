import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env.js';

let razorpayInstance = null;

if (env.NODE_ENV !== 'test') {
  razorpayInstance = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET
  });
}

/**
 * Creates an order on Razorpay server-side.
 * In test mode, it mocks the API response without calling the external service.
 * @param {number} amount Amount in paise
 * @param {string} receipt Unique receipt reference
 * @param {object} notes Metadata notes
 */
export const createRazorpayOrder = async (amount, receipt, notes) => {
  if (env.NODE_ENV === 'test') {
    // Return mock order response
    const mockOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    return {
      id: mockOrderId,
      amount,
      currency: 'INR',
      receipt,
      notes,
      status: 'created'
    };
  }

  return razorpayInstance.orders.create({
    amount,
    currency: 'INR',
    receipt,
    notes
  });
};

/**
 * Safe signature comparison using timingSafeEqual.
 * Validates types, lengths, character set, and compares buffers safely.
 * Returns false on mismatch or malformed inputs without throwing.
 */
export const safeCompareSignatures = (expectedHex, receivedHex) => {
  if (typeof expectedHex !== 'string' || typeof receivedHex !== 'string') {
    return false;
  }
  // Hex validation: exactly 64 characters (HMAC SHA256)
  const hexRegex = /^[0-9a-fA-F]{64}$/;
  if (!hexRegex.test(expectedHex) || !hexRegex.test(receivedHex)) {
    return false;
  }

  try {
    const expectedBuf = Buffer.from(expectedHex, 'hex');
    const receivedBuf = Buffer.from(receivedHex, 'hex');

    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch (error) {
    return false;
  }
};

/**
 * Verifies Razorpay Webhook Signatures using HMAC SHA-256
 * @param {string|Buffer} rawBody Raw body buffer of the request
 * @param {string} signature x-razorpay-signature header value
 * @param {string} secret Webhook secret
 */
export const verifyWebhookSignature = (rawBody, signature, secret) => {
  if (!rawBody || !signature || !secret) return false;
  try {
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(rawBody);
    const digest = shasum.digest('hex');
    return safeCompareSignatures(digest, signature);
  } catch (error) {
    return false;
  }
};

/**
 * Fetches canonical payment details directly from Razorpay provider.
 * In test mode, returns predictable mock objects based on payment ID.
 * @param {string} paymentId Razorpay payment ID
 */
export const fetchRazorpayPayment = async (paymentId) => {
  if (env.NODE_ENV === 'test') {
    if (paymentId && paymentId.startsWith('pay_authorized')) {
      return {
        id: paymentId,
        order_id: 'order_mockOrderId123',
        amount: 500000,
        currency: 'INR',
        status: 'authorized',
        captured: false,
        method: 'card'
      };
    }
    if (paymentId && paymentId.startsWith('pay_failed')) {
      return {
        id: paymentId,
        order_id: 'order_mockOrderId123',
        amount: 500000,
        currency: 'INR',
        status: 'failed',
        captured: false,
        method: 'card',
        error_description: 'Card declined'
      };
    }
    if (paymentId === 'pay_tamperedAmount') {
      return {
        id: paymentId,
        order_id: 'order_mockOrderId123',
        amount: 100,
        currency: 'INR',
        status: 'captured',
        captured: true,
        method: 'card'
      };
    }
    if (paymentId === 'pay_tamperedCurrency') {
      return {
        id: paymentId,
        order_id: 'order_mockOrderId123',
        amount: 500000,
        currency: 'USD',
        status: 'captured',
        captured: true,
        method: 'card'
      };
    }
    if (paymentId === 'pay_tamperedOrder') {
      return {
        id: paymentId,
        order_id: 'order_different123',
        amount: 500000,
        currency: 'INR',
        status: 'captured',
        captured: true,
        method: 'card'
      };
    }
    return {
      id: paymentId,
      order_id: 'order_mockOrderId123',
      amount: 500000,
      currency: 'INR',
      status: 'captured',
      captured: true,
      method: 'card'
    };
  }

  if (!razorpayInstance) {
    throw new Error('Razorpay client not initialized');
  }
  return razorpayInstance.payments.fetch(paymentId);
};

/**
 * Fetches canonical order details directly from Razorpay provider.
 * In test mode, returns predictable mock objects.
 * @param {string} orderId Razorpay order ID
 */
export const fetchRazorpayOrder = async (orderId) => {
  if (env.NODE_ENV === 'test') {
    if (orderId === 'order_unpaidId') {
      return {
        id: orderId,
        amount: 500000,
        currency: 'INR',
        status: 'created',
        attempts: 1
      };
    }
    return {
      id: orderId,
      amount: 500000,
      amount_paid: 500000,
      amount_due: 0,
      currency: 'INR',
      status: 'paid',
      attempts: 1
    };
  }

  if (!razorpayInstance) {
    throw new Error('Razorpay client not initialized');
  }
  return razorpayInstance.orders.fetch(orderId);
};
