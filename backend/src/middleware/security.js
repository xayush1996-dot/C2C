import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

export const helmetMiddleware = helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Configures origins parsed from environmental configuration (e.g. comma-separated lists)
const parseCorsOrigins = (originString) => {
  if (!originString || originString === '*') {
    return '*';
  }
  if (originString.includes(',')) {
    return originString.split(',').map((o) => o.trim());
  }
  return originString;
};

const allowedOrigins = parseCorsOrigins(env.CORS_ORIGIN);

export const corsMiddleware = cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Admin-Client'],
  credentials: allowedOrigins !== '*',
  optionsSuccessStatus: 200
});

// Custom request header check for CSRF defense-in-depth on cookie-authenticated requests
export const csrfProtect = (req, res, next) => {
  const customHeader = req.headers['x-admin-client'] || req.headers['x-requested-with'];
  
  if (!customHeader) {
    return next(new AppError('CSRF protection: missing custom request header', 403));
  }
  next();
};
