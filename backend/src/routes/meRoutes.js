import express from 'express';
import { getProfile, updateProfile } from '../controllers/meController.js';
import { protectCustomer } from '../middleware/auth.js';
import { profileUpdateRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All customer self-service routes are protected
router.get('/profile', protectCustomer, getProfile);
router.patch('/profile', protectCustomer, profileUpdateRateLimiter, updateProfile);

export default router;
