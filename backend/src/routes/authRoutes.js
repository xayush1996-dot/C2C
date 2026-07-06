import express from 'express';
import {
  register,
  login,
  google,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { protectCustomer } from '../middleware/auth.js';
import { csrfProtect } from '../middleware/security.js';
import {
  customerLoginRateLimiter,
  forgotPasswordRateLimiter,
  registerRateLimiter,
  authRateLimiter
} from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes with specific rate limiters
router.post('/register', registerRateLimiter, register);
router.post('/login', customerLoginRateLimiter, login);
router.post('/google', customerLoginRateLimiter, google);
router.post('/forgot-password', forgotPasswordRateLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

// Session routes
router.post('/refresh', csrfProtect, authRateLimiter, refresh);
router.post('/logout', csrfProtect, authRateLimiter, logout);

// Protected routes
router.get('/me', protectCustomer, me);

export default router;
