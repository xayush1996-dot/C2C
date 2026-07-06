import express from 'express';
import { submitEnquiry } from '../controllers/enquiriesController.js';
import { enquirySubmitRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public route to submit an enquiry
router.post('/', enquirySubmitRateLimiter, submitEnquiry);

export default router;
