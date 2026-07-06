import express from 'express';
import { login, logout, refresh, me } from '../controllers/adminAuthController.js';
import { protectAdmin } from '../middleware/auth.js';
import { loginRateLimiter, authRateLimiter } from '../middleware/rateLimiter.js';
import { csrfProtect } from '../middleware/security.js';

const router = express.Router();

// Public routes (login rate limited)
router.post('/login', loginRateLimiter, login);
router.post('/refresh', csrfProtect, authRateLimiter, refresh);
router.post('/logout', csrfProtect, authRateLimiter, logout);

// Protected routes
router.get('/me', protectAdmin, me);

export default router;
