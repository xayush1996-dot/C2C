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
 * Verifies Razorpay Webhook Signatures using HMAC SHA-256
 * @param {string|Buffer} rawBody Raw body buffer of the request
 * @param {string} signature x-razorpay-signature header value
 * @param {string} secret Webhook secret
 */
export const verifyWebhookSignature = (rawBody, signature, secret) => {
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(rawBody);
  const digest = shasum.digest('hex');
  return digest === signature;
};
