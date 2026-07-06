import express from 'express';
import { handleRazorpayWebhook } from '../controllers/razorpayWebhookController.js';

const router = express.Router();

// Public webhook endpoint with signature validation inside the controller
router.post('/', handleRazorpayWebhook);

export default router;
