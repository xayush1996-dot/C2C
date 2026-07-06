import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Enquiry from '../models/Enquiry.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import app from '../app.js';
import { env } from '../config/env.js';
import { enquirySubmitRateLimiter, profileUpdateRateLimiter } from '../middleware/rateLimiter.js';

describe('Enquiries and Customer Self-Service APIs Tests', () => {
  // Mock data definitions
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockAdminId = new mongoose.Types.ObjectId().toString();
  const mockEnquiryId = new mongoose.Types.ObjectId().toString();

  const mockCustomerUser = {
    _id: mockUserId,
    name: 'Customer User',
    email: 'customer@example.com',
    role: 'CUSTOMER',
    failedLoginAttempts: 0,
    lockoutUntil: null
  };

  const mockAdminUser = {
    _id: mockAdminId,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    isActive: true
  };

  const mockEnquiryDoc = {
    _id: mockEnquiryId,
    name: 'John Visitor',
    email: 'visitor@example.com',
    subject: 'Question about services',
    message: 'Hello, I would like to know more about pricing and calendars.',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // JWT Generators
  const generateCustomerToken = (userId = mockUserId) => {
    return jwt.sign({ id: userId, role: 'CUSTOMER' }, env.JWT_SECRET, { expiresIn: '15m' });
  };

  const generateAdminToken = (adminId = mockAdminId) => {
    return jwt.sign({ id: adminId, role: 'ADMIN' }, env.JWT_SECRET, { expiresIn: '15m' });
  };

  beforeEach(async () => {
    jest.restoreAllMocks();

    // Reset rate limiter keys in test mode to isolate test cases
    if (enquirySubmitRateLimiter && typeof enquirySubmitRateLimiter.resetKey === 'function') {
      await enquirySubmitRateLimiter.resetKey('127.0.0.1');
      await enquirySubmitRateLimiter.resetKey('::ffff:127.0.0.1');
      await enquirySubmitRateLimiter.resetKey('::1');
    }
    if (profileUpdateRateLimiter && typeof profileUpdateRateLimiter.resetKey === 'function') {
      await profileUpdateRateLimiter.resetKey('127.0.0.1');
      await profileUpdateRateLimiter.resetKey('::ffff:127.0.0.1');
      await profileUpdateRateLimiter.resetKey('::1');
    }
  });

  describe('POST /api/enquiries (Public submission & Spam resistance)', () => {
    it('should successfully submit an enquiry as a visitor (anonymous)', async () => {
      const createSpy = jest.spyOn(Enquiry, 'create').mockResolvedValue({
        ...mockEnquiryDoc,
        user: undefined
      });

      const res = await request(app)
        .post('/api/enquiries')
        .send({
          name: 'John Visitor',
          email: 'visitor@example.com',
          subject: 'Question',
          message: 'Hello! I need some information about booking.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.enquiry.name).toBe('John Visitor');
      expect(res.body.enquiry.email).toBe('visitor@example.com');
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        name: 'John Visitor',
        email: 'visitor@example.com',
        subject: 'Question',
        message: 'Hello! I need some information about booking.'
      }));
    });

    it('should successfully submit and associate the enquiry if a valid Customer JWT is provided', async () => {
      const createSpy = jest.spyOn(Enquiry, 'create').mockResolvedValue({
        ...mockEnquiryDoc,
        user: mockUserId
      });

      const customerToken = generateCustomerToken();

      const res = await request(app)
        .post('/api/enquiries')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Customer User',
          email: 'customer@example.com',
          message: 'Hello! I am logged in and asking a question.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Customer User',
        email: 'customer@example.com',
        user: mockUserId
      }));
    });

    it('should reject submission on strict validation failures (e.g. missing name, invalid email, short message)', async () => {
      const createSpy = jest.spyOn(Enquiry, 'create');

      // Missing name
      let res = await request(app)
        .post('/api/enquiries')
        .send({ email: 'test@example.com', message: 'Hello! This is a long message.' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Name is required');

      // Invalid email
      res = await request(app)
        .post('/api/enquiries')
        .send({ name: 'Test', email: 'invalid-email', message: 'Hello! This is a long message.' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('valid email address');

      // Short message (< 10 chars)
      res = await request(app)
        .post('/api/enquiries')
        .send({ name: 'Test', email: 'test@example.com', message: 'Short' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('at least 10 characters long');

      expect(createSpy).not.toHaveBeenCalled();
    });

    it('should ignore user-submitted role or status parameters (Mass Assignment protection)', async () => {
      const createSpy = jest.spyOn(Enquiry, 'create').mockResolvedValue(mockEnquiryDoc);

      await request(app)
        .post('/api/enquiries')
        .send({
          name: 'Spammer',
          email: 'spam@example.com',
          message: 'Hello! This is a legitimate enquiry.',
          status: 'RESOLVED', // Attempt to inject status
          user: new mongoose.Types.ObjectId().toString() // Attempt to inject user ID
        });

      // Verify that status and user are NOT passed to Enquiry.create
      expect(createSpy).toHaveBeenCalledWith({
        name: 'Spammer',
        email: 'spam@example.com',
        subject: '',
        message: 'Hello! This is a legitimate enquiry.'
      });
    });

    it('should silently drop spam submissions when the honeypot field is filled (Spam resistance)', async () => {
      const createSpy = jest.spyOn(Enquiry, 'create');

      const res = await request(app)
        .post('/api/enquiries')
        .send({
          name: 'Spam Bot',
          email: 'bot@spam.com',
          message: 'Buy these amazing products right now!',
          honey: 'bot-fill-in-value' // Honeypot field filled
        });

      // Verify we spoof success (201 Created) but do NOT store it in the database
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('Admin Enquiry API Routes (/api/admin/enquiries)', () => {
    it('should reject access to all admin enquiry routes if unauthenticated', async () => {
      let res = await request(app).get('/api/admin/enquiries');
      expect(res.status).toBe(401);

      res = await request(app).get(`/api/admin/enquiries/${mockEnquiryId}`);
      expect(res.status).toBe(401);

      res = await request(app).patch(`/api/admin/enquiries/${mockEnquiryId}/status`).send({ status: 'RESOLVED' });
      expect(res.status).toBe(401);
    });

    it('should reject access to all admin enquiry routes if authenticated as a customer', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      const customerToken = generateCustomerToken();

      let res = await request(app)
        .get('/api/admin/enquiries')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);

      res = await request(app)
        .get(`/api/admin/enquiries/${mockEnquiryId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);

      res = await request(app)
        .patch(`/api/admin/enquiries/${mockEnquiryId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'RESOLVED' });
      expect(res.status).toBe(403);
    });

    it('should allow Admin access to list enquiries with safe pagination, safe filters, and safe search', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
      const adminToken = generateAdminToken();

      const mockFindChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockEnquiryDoc])
      };

      const countSpy = jest.spyOn(Enquiry, 'countDocuments').mockResolvedValue(1);
      const findSpy = jest.spyOn(Enquiry, 'find').mockReturnValue(mockFindChain);

      const res = await request(app)
        .get('/api/admin/enquiries?page=2&limit=5&status=PENDING&q=Visitor')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(5);
      expect(res.body.enquiries).toHaveLength(1);

      // Verify page offsets: page 2, limit 5 => skip 5, limit 5
      expect(mockFindChain.skip).toHaveBeenCalledWith(5);
      expect(mockFindChain.limit).toHaveBeenCalledWith(5);

      // Verify count query and find query status filtering + safe regex search
      expect(countSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'PENDING',
        $or: expect.any(Array)
      }));
      expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'PENDING',
        $or: expect.any(Array)
      }));
    });

    it('should escape special regex characters in search queries to prevent ReDoS injection', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
      const adminToken = generateAdminToken();

      const mockFindChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockEnquiryDoc])
      };

      jest.spyOn(Enquiry, 'countDocuments').mockResolvedValue(1);
      const findSpy = jest.spyOn(Enquiry, 'find').mockReturnValue(mockFindChain);

      // Search term with special regex characters
      const maliciousQ = '.*+?^${}()|[]\\';

      const res = await request(app)
        .get(`/api/admin/enquiries?q=${encodeURIComponent(maliciousQ)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      
      // Verify that find was called with escaped special characters
      const expectedEscaped = '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\';
      expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({
        $or: expect.arrayContaining([
          expect.objectContaining({
            name: { $regex: expectedEscaped, $options: 'i' }
          })
        ])
      }));
    });

    it('should ignore NoSQL operators injected in filter queries (NoSQL Injection mitigation)', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
      const adminToken = generateAdminToken();

      const mockFindChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockEnquiryDoc])
      };

      jest.spyOn(Enquiry, 'countDocuments').mockResolvedValue(1);
      const findSpy = jest.spyOn(Enquiry, 'find').mockReturnValue(mockFindChain);

      // Attempt status operator injection (Express parses status[$ne]=RESOLVED as { status: { '$ne': 'RESOLVED' } })
      const res = await request(app)
        .get('/api/admin/enquiries?status[$ne]=RESOLVED')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      
      // Verify that status search query is completely ignored/ignored because it's not a primitive string
      expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({}));
      expect(findSpy.mock.calls[0][0].status).toBeUndefined();
    });

    it('should retrieve a single enquiry by ID', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
      const adminToken = generateAdminToken();

      const mockFindByIdChain = {
        populate: jest.fn().mockResolvedValue(mockEnquiryDoc)
      };
      jest.spyOn(Enquiry, 'findById').mockReturnValue(mockFindByIdChain);

      const res = await request(app)
        .get(`/api/admin/enquiries/${mockEnquiryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.enquiry._id).toBe(mockEnquiryId);
    });

    it('should reject single enquiry query if ID format is invalid', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
      const adminToken = generateAdminToken();

      const res = await request(app)
        .get('/api/admin/enquiries/invalid-mongo-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid enquiry ID format');
    });

    it('should update enquiry status with strict validation (status enum boundary checks)', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
      const adminToken = generateAdminToken();

      const mockUpdatedEnquiry = { ...mockEnquiryDoc, status: 'RESOLVED' };
      const mockFindByIdAndUpdateChain = {
        populate: jest.fn().mockResolvedValue(mockUpdatedEnquiry)
      };
      const updateSpy = jest.spyOn(Enquiry, 'findByIdAndUpdate').mockReturnValue(mockFindByIdAndUpdateChain);

      // Valid update
      let res = await request(app)
        .patch(`/api/admin/enquiries/${mockEnquiryId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.enquiry.status).toBe('RESOLVED');
      expect(updateSpy).toHaveBeenCalledWith(
        mockEnquiryId,
        { $set: { status: 'RESOLVED' } },
        expect.any(Object)
      );

      // Invalid status value
      res = await request(app)
        .patch(`/api/admin/enquiries/${mockEnquiryId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'MALICIOUS_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid status value');
    });
  });

  describe('Customer Self-Service /api/me/profile Endpoints (IDOR & Injection checks)', () => {
    it('should retrieve current customer profile data, ignoring raw ID params (IDOR mitigation)', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      const customerToken = generateCustomerToken();

      const res = await request(app)
        .get('/api/me/profile')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.id).toBe(mockUserId);
      expect(res.body.user.role).toBe('CUSTOMER');
      expect(res.body.user.password).toBeUndefined();
    });

    it('should block profile retrieval if unauthenticated', async () => {
      const res = await request(app).get('/api/me/profile');
      expect(res.status).toBe(401);
    });

    it('should successfully update whitelisted customer profile fields', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      jest.spyOn(User, 'findOne').mockResolvedValue(null); // No other user has the new email
      
      const mockUpdatedUser = {
        ...mockCustomerUser,
        name: 'New Customer Name',
        email: 'newemail@example.com'
      };
      
      const updateSpy = jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue(mockUpdatedUser);
      const customerToken = generateCustomerToken();

      const res = await request(app)
        .patch('/api/me/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'New Customer Name',
          email: 'newemail@example.com'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('New Customer Name');
      expect(res.body.user.email).toBe('newemail@example.com');
      
      expect(updateSpy).toHaveBeenCalledWith(
        mockUserId,
        { $set: { name: 'New Customer Name', email: 'newemail@example.com' } },
        expect.any(Object)
      );
    });

    it('should reject email update if the target email is already taken by another account', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      // Simulate another user owning the email
      jest.spyOn(User, 'findOne').mockResolvedValue({ _id: 'other-user-id', email: 'taken@example.com' });
      
      const customerToken = generateCustomerToken();

      const res = await request(app)
        .patch('/api/me/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          email: 'taken@example.com'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Email already in use');
    });

    it('should ignore security fields and roles submitted during profile updates (Mass Assignment protection)', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockCustomerUser);
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      
      const mockUpdatedUser = {
        ...mockCustomerUser,
        name: 'Updated Name Only'
      };
      
      const updateSpy = jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue(mockUpdatedUser);
      const customerToken = generateCustomerToken();

      const res = await request(app)
        .patch('/api/me/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Updated Name Only',
          role: 'ADMIN', // Injection
          password: 'MaliciousPassword123', // Injection
          googleId: 'googleid_hack', // Injection
          failedLoginAttempts: 0, // Injection
          lockoutUntil: null // Injection
        });

      expect(res.status).toBe(200);
      
      // Ensure only 'name' was passed in updates; everything else is ignored
      expect(updateSpy).toHaveBeenCalledWith(
        mockUserId,
        { $set: { name: 'Updated Name Only' } },
        expect.any(Object)
      );
    });
  });
});
