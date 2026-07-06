import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

// Rate limiting configurations for administrative login protection
export const loginRateLimiter = rateLimit({
  windowMs: env.NODE_ENV === 'test' ? 10 * 1000 : 15 * 60 * 1000, // 10 seconds for tests, 15 minutes for production
  max: 5, // Permit at most 5 attempts per windowMs
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Too many failed login attempts, please try again later', 429));
  }
});

// Generic auth rate limiter to protect /refresh and /logout from DoS/query exhaustion
export const authRateLimiter = rateLimit({
  windowMs: env.NODE_ENV === 'test' ? 10 * 1000 : 15 * 60 * 1000,
  max: 30, // 30 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Too many requests, please try again later', 429));
  }
});

// Rate limiter for customer login endpoints
export const customerLoginRateLimiter = rateLimit({
  windowMs: env.NODE_ENV === 'test' ? 10 * 1000 : 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Too many failed login attempts, please try again later', 429));
  }
});

// Rate limiter for forgot-password requests
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: env.NODE_ENV === 'test' ? 10 * 1000 : 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Too many password reset requests, please try again later', 429));
  }
});

// Rate limiter for customer registration
export const registerRateLimiter = rateLimit({
  windowMs: env.NODE_ENV === 'test' ? 10 * 1000 : 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Too many registration requests, please try again later', 429));
  }
});

// Rate limiter for public enquiry submissions (prevent spam)
export const enquirySubmitRateLimiter = rateLimit({
  windowMs: env.NODE_ENV === 'test' ? 10 * 1000 : 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Too many enquiry submissions, please try again later', 429));
  }
});

// Rate limiter for customer profile updates
export const profileUpdateRateLimiter = rateLimit({
  windowMs: env.NODE_ENV === 'test' ? 10 * 1000 : 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Too many profile update requests, please try again later', 429));
  }
});

// Rate limiter for payment order creations to mitigate DB flooding and Razorpay API abuse
export const paymentOrderRateLimiter = rateLimit({
  windowMs: env.NODE_ENV === 'test' ? 10 * 1000 : 15 * 60 * 1000,
  max: 15, // permit at most 15 order creations per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Too many payment orders initiated. Please complete existing orders or try again later', 429));
  }
});

