import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { helmetMiddleware, corsMiddleware } from './middleware/security.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import meRoutes from './routes/meRoutes.js';
import enquiriesRoutes from './routes/enquiriesRoutes.js';
import adminEnquiriesRoutes from './routes/adminEnquiriesRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import mePaymentRoutes from './routes/mePaymentRoutes.js';
import adminPaymentRoutes from './routes/adminPaymentRoutes.js';
import razorpayWebhookRoute from './routes/razorpayWebhookRoute.js';
import meBookingRoutes from './routes/meBookingRoutes.js';
import adminBookingRoutes from './routes/adminBookingRoutes.js';
import calendlyWebhookRoute from './routes/calendlyWebhookRoute.js';
import adminDashboardRoutes from './routes/adminDashboardRoutes.js';
import adminCustomerRoutes from './routes/adminCustomerRoutes.js';
import adminReportRoutes from './routes/adminReportRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import adminContentRoutes from './routes/adminContentRoutes.js';
import servicesRoutes from './routes/servicesRoutes.js';
import adminServiceRoutes from './routes/adminServiceRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import adminVideoRoutes from './routes/adminVideoRoutes.js';
import { env } from './config/env.js';

const app = express();

app.set('trust proxy', env.TRUST_PROXY);

// Parse cookies for security tokens
app.use(cookieParser());

// Set security headers
app.use(helmetMiddleware);

// Set strict CORS policy
app.use(corsMiddleware);

// Restrict incoming payload sizes to prevent DoS attacks, preserving raw body buffer for webhook signature checks
app.use(express.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/webhooks/')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Root path route for default service/health checks
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running'
  });
});

// Health Check route
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  // 1 is connected, 2 is connecting (which is acceptable for startup checks, but we'll require connected for full health)
  const isDbConnected = dbState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'success' : 'error',
    message: isDbConnected ? 'System is healthy' : 'Database is unhealthy',
    timestamp: new Date().toISOString(),
    db: {
      state: dbStatusMap[dbState] || 'unknown',
      connected: isDbConnected
    }
  });
});

// Customer API routes
app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/me/payments', mePaymentRoutes);
app.use('/api/me/bookings', meBookingRoutes);
app.use('/api/enquiries', enquiriesRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/videos', videoRoutes);

// Administrative API routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/enquiries', adminEnquiriesRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);
app.use('/api/admin/bookings', adminBookingRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/customers', adminCustomerRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/admin/content', adminContentRoutes);
app.use('/api/admin/services', adminServiceRoutes);
app.use('/api/admin/videos', adminVideoRoutes);

// Webhook routes
app.use('/api/webhooks/razorpay', razorpayWebhookRoute);
app.use('/api/webhooks/calendly', calendlyWebhookRoute);

// Wildcard 404 router
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
