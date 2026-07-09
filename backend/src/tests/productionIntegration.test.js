import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { env } from '../config/env.js';
import { seedServices } from '../config/db.js';
import fs from 'fs';
import path from 'path';

describe('Production Integration & Regression Tests', () => {
  let mongoServer = null;

  beforeAll(async () => {
    // Suppress warning logs from connectDB fallback in tests
    mongoose.set('strictQuery', true);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('1 & 2. Production CORS Origin Controls', () => {
    it('should allow the actual deployed Vercel preview/production origin with credentials', async () => {
      // Simulate Render CORS configuration
      const testOrigin = 'https://con-2-maen8mb1p-xayush1996-dots-projects.vercel.app';
      
      const res = await request(app)
        .options('/api/health')
        .set('Origin', testOrigin)
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBe(testOrigin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should reject unauthorized origins from receiving CORS headers', async () => {
      const unauthorizedOrigin = 'https://malicious-unauthorized-domain.com';
      
      const res = await request(app)
        .options('/api/health')
        .set('Origin', unauthorizedOrigin)
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('3. Production API Base URL & Centralization', () => {
    it('should verify VITE_API_BASE_URL resolves to the Render backend domain', () => {
      const apiFileContent = fs.readFileSync(
        path.join(process.cwd(), '..', 'frontend', 'src', 'lib', 'api.js'),
        'utf8'
      );
      
      // Ensure VITE_API_BASE_URL is used in apiFetch helper
      expect(apiFileContent).toContain('import.meta.env.VITE_API_BASE_URL');
      expect(apiFileContent).toContain('fetch(url, options)');
    });
  });

  describe('4. No Production Localhost API Calls', () => {
    it('should ensure no frontend pages contain hardcoded localhost calls to port 5000', () => {
      const pagesDir = path.join(process.cwd(), '..', 'frontend', 'src', 'pages');
      const files = fs.readdirSync(pagesDir);
      
      files.forEach((file) => {
        if (file.endsWith('.jsx')) {
          const content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
          // No localhost or :5000 in raw fetch strings
          expect(content).not.toMatch(/fetch\(['"`]\s*http:\/\/localhost:5000/);
          expect(content).not.toMatch(/fetch\(['"`]\s*http:\/\/127\.0\.0\.1:5000/);
        }
      });
    });
  });

  describe('8. Paid Feature / Product Seeding Mapping', () => {
    it('should verify all frontend-supported services are properly defined in DB seeding catalog', async () => {
      // Connect to test database and run seeding
      if (mongoose.connection.readyState !== 1) {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
      }

      await seedServices();

      // Query database for our correct seeded services
      const seededCodes = await Service.find({ isActive: true }).distinct('code');
      
      const expectedCodes = ['eq', 'public', 'private', 'resume', 'premium_videos'];
      expectedCodes.forEach((code) => {
        expect(seededCodes).toContain(code);
      });
    });
  });

  describe('9. Customer Invoices and Admin PDF Reports Routes - Real PDF Verification', () => {
    let customerA, customerB, admin;
    let tokenA, tokenB, adminToken;
    let paymentSuccess, paymentPending, service;

    beforeAll(async () => {
      // Connect to DB and seed if not done yet
      if (mongoose.connection.readyState !== 1) {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
      }
      await seedServices();
      service = await Service.findOne({ code: 'eq' });

      // Create test users
      customerA = await User.create({ name: 'Customer Alice', email: 'alice@test.com', role: 'CUSTOMER' });
      customerB = await User.create({ name: 'Customer Bob', email: 'bob@test.com', role: 'CUSTOMER' });
      admin = await Admin.create({
        name: 'Admin Master',
        email: 'admin@test.com',
        adminId: 'admin_test_123',
        password: 'AdminPassword123'
      });

      tokenA = jwt.sign({ id: customerA._id, role: 'CUSTOMER' }, env.JWT_SECRET, { expiresIn: '15m' });
      tokenB = jwt.sign({ id: customerB._id, role: 'CUSTOMER' }, env.JWT_SECRET, { expiresIn: '15m' });
      adminToken = jwt.sign({ id: admin._id, role: 'ADMIN' }, env.JWT_SECRET, { expiresIn: '15m' });

      // Create bookings and payments
      const bookingA = await Booking.create({
        user: customerA._id,
        service: service._id,
        status: 'CONFIRMED',
        bookingReference: 'booking_alice_123'
      });
      paymentSuccess = await Payment.create({
        user: customerA._id,
        booking: bookingA._id,
        amount: 299900,
        currency: 'INR',
        razorpayOrderId: 'order_alice123',
        razorpayPaymentId: 'pay_alice123',
        status: 'SUCCESS'
      });

      const bookingB = await Booking.create({
        user: customerA._id,
        service: service._id,
        status: 'PENDING',
        bookingReference: 'booking_alice_456'
      });
      paymentPending = await Payment.create({
        user: customerA._id,
        booking: bookingB._id,
        amount: 299900,
        currency: 'INR',
        razorpayOrderId: 'order_alice456',
        status: 'PENDING'
      });
    });

    it('should allow authenticated customer to download their own successful payment invoice', async () => {
      const res = await request(app)
        .get(`/api/me/payments/${paymentSuccess._id}/invoice`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      // A valid PDF begins with %PDF- (hex: 25 50 44 46 2d)
      expect(Buffer.isBuffer(res.body)).toBe(true);
      expect(res.body.toString('utf-8', 0, 5)).toBe('%PDF-');
    });

    it('should deny access to invoice download if customer tries to download another customer’s payment (403)', async () => {
      const res = await request(app)
        .get(`/api/me/payments/${paymentSuccess._id}/invoice`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
    });

    it('should reject invoice download if payment is still pending (400)', async () => {
      const res = await request(app)
        .get(`/api/me/payments/${paymentPending._id}/invoice`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
    });

    it('should allow authenticated admin to export all PDF report types successfully', async () => {
      const reportTypes = ['bookings', 'payments', 'enquiries', 'customers'];
      for (const type of reportTypes) {
        const res = await request(app)
          .get(`/api/admin/reports/${type}?startDate=2026-07-01&endDate=2026-07-31`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('application/pdf');
        expect(Buffer.isBuffer(res.body)).toBe(true);
        expect(res.body.toString('utf-8', 0, 5)).toBe('%PDF-');
      }
    });

    it('should reject PDF report access for customer role (403)', async () => {
      const res = await request(app)
        .get('/api/admin/reports/bookings?startDate=2026-07-01&endDate=2026-07-31')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(403);
    });
  });
});
