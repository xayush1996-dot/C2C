import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { protectCustomer } from '../middleware/auth.js';
import { paymentOrderRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Customer payment order creation and signature verification
router.post('/create-order', protectCustomer, paymentOrderRateLimiter, createOrder);
router.post('/verify', protectCustomer, verifyPayment);

export default router;
