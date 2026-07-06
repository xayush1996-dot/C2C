import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Enquiry from '../models/Enquiry.js';
import app from '../app.js';
import { env } from '../config/env.js';

describe('Admin Dashboard, Customers & Reports API Tests', () => {
  const mockAdminId = new mongoose.Types.ObjectId().toString();
  const mockCustomerId = new mongoose.Types.ObjectId().toString();

  const mockAdminUser = {
    _id: mockAdminId,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    isActive: true
  };

  const mockCustomerUser = {
    _id: mockCustomerId,
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: 'CUSTOMER',
    googleId: 'google_123',
    failedLoginAttempts: 0
  };

  const generateAdminToken = () => {
    return jwt.sign({ id: mockAdminId, role: 'ADMIN' }, env.JWT_SECRET, { expiresIn: '15m' });
  };

  const generateCustomerToken = () => {
    return jwt.sign({ id: mockCustomerId, role: 'CUSTOMER' }, env.JWT_SECRET, { expiresIn: '15m' });
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/admin/dashboard/summary', () => {
    it('should deny access if not authenticated or role is not ADMIN', async () => {
      const res = await request(app).get('/api/admin/dashboard/summary');
      expect(res.status).toBe(401);

      const customerToken = generateCustomerToken();
      const res2 = await request(app)
        .get('/api/admin/dashboard/summary')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res2.status).toBe(403);
    });

    it('should return aggregated summary statistics successfully', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
      
      jest.spyOn(Enquiry, 'countDocuments').mockResolvedValue(5);
      jest.spyOn(Booking, 'countDocuments').mockResolvedValue(10);
      jest.spyOn(Payment, 'countDocuments').mockResolvedValue(8);
      jest.spyOn(User, 'countDocuments').mockResolvedValue(12);

      jest.spyOn(Payment, 'aggregate').mockResolvedValue([{ _id: null, totalAmount: 500000 }]); // 5000 INR

      const adminToken = generateAdminToken();
      const res = await request(app)
        .get('/api/admin/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.enquiries.total).toBe(5);
      expect(res.body.data.bookings.total).toBe(10);
      expect(res.body.data.payments.total).toBe(8);
      expect(res.body.data.payments.totalRevenue).toBe(5000);
      expect(res.body.data.customers.total).toBe(12);
    });
  });

  describe('GET /api/admin/customers', () => {
    it('should retrieve customer listing with pagination, search, and minimal data exposure', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
      jest.spyOn(User, 'countDocuments').mockResolvedValue(1);

      const mockFindChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCustomerUser])
      };
      const findSpy = jest.spyOn(User, 'find').mockReturnValue(mockFindChain);

      const adminToken = generateAdminToken();
      const res = await request(app)
        .get('/api/admin/customers?page=1&limit=5&search=Jane')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.customers).toHaveLength(1);
      expect(res.body.customers[0].name).toBe('Jane Doe');
      
      // Ensure secrets like passwords or reset tokens are not exposed
      expect(res.body.customers[0].password).toBeUndefined();
      expect(res.body.customers[0].resetPasswordToken).toBeUndefined();

      expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({
        role: 'CUSTOMER',
        $or: [
          { name: { $regex: 'Jane', $options: 'i' } },
          { email: { $regex: 'Jane', $options: 'i' } }
        ]
      }));
    });
  });

  describe('GET /api/admin/customers/:id', () => {
    it('should return 400 for invalid ID format', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);

      const adminToken = generateAdminToken();
      const res = await request(app)
        .get('/api/admin/customers/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid customer ID format');
    });

    it('should return 404 if customer does not exist', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
      jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const adminToken = generateAdminToken();
      const res = await request(app)
        .get(`/api/admin/customers/${mockCustomerId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Customer not found');
    });

    it('should return customer details along with recent bookings and payments summary', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
      
      jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockCustomerUser)
      });

      const mockBooking = { _id: 'b123', status: 'CONFIRMED' };
      const mockPayment = { _id: 'p123', amount: 5000, status: 'SUCCESS' };

      jest.spyOn(Booking, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockBooking])
      });

      jest.spyOn(Payment, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockPayment])
      });

      const adminToken = generateAdminToken();
      const res = await request(app)
        .get(`/api/admin/customers/${mockCustomerId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.customer.email).toBe('jane@example.com');
      expect(res.body.bookings).toHaveLength(1);
      expect(res.body.bookings[0]._id).toBe('b123');
      expect(res.body.payments).toHaveLength(1);
      expect(res.body.payments[0]._id).toBe('p123');
    });
  });

  describe('PDF Report Routes (GET /api/admin/reports/*)', () => {
    it('should validate invalid date filters and return 400', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);

      const adminToken = generateAdminToken();
      const res = await request(app)
        .get('/api/admin/reports/enquiries?startDate=not-a-date')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid startDate format');
    });

    it('should validate invalid status query filters and return 400', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);

      const adminToken = generateAdminToken();
      const res = await request(app)
        .get('/api/admin/reports/enquiries?status=INVALID_STATUS')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid status query filter value');
    });

    it('should return PDF stream for enquiries report with correct response headers', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
      jest.spyOn(Enquiry, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      const adminToken = generateAdminToken();
      const res = await request(app)
        .get('/api/admin/reports/enquiries')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename=report_enquiries_');
    });

    it('should return PDF stream for payments report with correct response headers', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
      jest.spyOn(Payment, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      const adminToken = generateAdminToken();
      const res = await request(app)
        .get('/api/admin/reports/payments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename=report_payments_');
    });

    it('should return PDF stream for bookings report with correct response headers', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
      
      const mockBookingFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };
      jest.spyOn(Booking, 'find').mockReturnValue(mockBookingFind);

      const adminToken = generateAdminToken();
      const res = await request(app)
        .get('/api/admin/reports/bookings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename=report_bookings_');
    });

    it('should return PDF stream for customers report with correct response headers', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
      jest.spyOn(User, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      const adminToken = generateAdminToken();
      const res = await request(app)
        .get('/api/admin/reports/customers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename=report_customers_');
    });

    it('should limit database query results to 5000 to prevent DoS', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
      const limitSpy = jest.fn().mockResolvedValue([]);
      jest.spyOn(Enquiry, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: limitSpy
      });

      const adminToken = generateAdminToken();
      await request(app)
        .get('/api/admin/reports/enquiries')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(limitSpy).toHaveBeenCalledWith(5000);
    });
  });
});
