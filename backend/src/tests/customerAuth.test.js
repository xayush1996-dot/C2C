import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import UserRefreshToken from '../models/UserRefreshToken.js';
import app from '../app.js';
import { env } from '../config/env.js';
import { customerLoginRateLimiter } from '../middleware/rateLimiter.js';

describe('Customer Authentication System Tests', () => {
  // Helper to create mock customer User documents
  const createMockUserDoc = (overrides = {}) => {
    const doc = {
      _id: '6688c1f5f2424b335c0a2a01',
      email: 'customer@example.com',
      password: 'hashedpassword123',
      name: 'John Doe',
      role: 'CUSTOMER',
      failedLoginAttempts: 0,
      lockoutUntil: null,
      comparePassword: async (pwd) => pwd === 'CustomerPassword123',
      ...overrides
    };
    doc.save = jest.fn().mockImplementation(function () {
      return Promise.resolve(doc);
    });
    return doc;
  };

  const mockActiveUser = createMockUserDoc();

  // Helper to mock chainable select method on User.findOne
  const mockFindOneUser = (resolvedValue) => {
    return jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(resolvedValue)
    });
  };

  beforeEach(async () => {
    jest.restoreAllMocks();
    if (customerLoginRateLimiter && typeof customerLoginRateLimiter.resetKey === 'function') {
      await customerLoginRateLimiter.resetKey('127.0.0.1');
      await customerLoginRateLimiter.resetKey('::ffff:127.0.0.1');
      await customerLoginRateLimiter.resetKey('::1');
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register successfully and enforce CUSTOMER role (ignoring role injection)', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      const createSpy = jest.spyOn(User, 'create').mockImplementation((data) => {
        return Promise.resolve(createMockUserDoc({
          email: data.email,
          name: data.name,
          role: data.role // should be CUSTOMER regardless of req.body
        }));
      });
      jest.spyOn(UserRefreshToken, 'create').mockResolvedValue({ token: 'mocktoken' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'new@example.com',
          password: 'CustomerPassword123',
          name: 'Jane Doe',
          role: 'ADMIN', // Attempted role injection
          isAdmin: true  // Attempted parameter injection
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('CUSTOMER'); // Role injection ignored
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        email: 'new@example.com',
        role: 'CUSTOMER'
      }));
      expect(res.headers['set-cookie'][0]).toContain('customerRefreshToken');
    });

    it('should reject registration if email already exists', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(mockActiveUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'customer@example.com',
          password: 'Password123',
          name: 'Jane Doe'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate successfully with correct credentials', async () => {
      mockFindOneUser(mockActiveUser);
      jest.spyOn(UserRefreshToken, 'create').mockResolvedValue({ token: 'mocktoken' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'customer@example.com', password: 'CustomerPassword123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.email).toBe('customer@example.com');
      expect(res.body.user.role).toBe('CUSTOMER');
    });

    it('should reject login for wrong password', async () => {
      mockFindOneUser(mockActiveUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'customer@example.com', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject login for nonexistent customer', async () => {
      mockFindOneUser(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'Password123' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });

  describe('POST /api/auth/google', () => {
    it('should successfully register and login a new Google user', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      const createSpy = jest.spyOn(User, 'create').mockImplementation((data) => {
        return Promise.resolve(createMockUserDoc({
          email: data.email,
          name: data.name,
          googleId: data.googleId,
          role: 'CUSTOMER'
        }));
      });
      jest.spyOn(UserRefreshToken, 'create').mockResolvedValue({ token: 'mocktoken' });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'mock_google_token_newuser@example.com_googleid999' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('newuser@example.com');
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        email: 'newuser@example.com',
        googleId: 'googleid999',
        role: 'CUSTOMER'
      }));
    });

    it('should log in existing Google user without creating a new record', async () => {
      const mockGoogleUser = createMockUserDoc({ googleId: 'googleid123' });
      jest.spyOn(User, 'findOne').mockResolvedValue(mockGoogleUser);
      jest.spyOn(UserRefreshToken, 'create').mockResolvedValue({ token: 'mocktoken' });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'mock_google_token_customer@example.com_googleid123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('customer@example.com');
    });

    it('should reject Google login if email is registered with a local password (no silent linking)', async () => {
      const mockLocalUser = createMockUserDoc({ googleId: undefined }); // Has local account, no googleId
      jest.spyOn(User, 'findOne').mockResolvedValue(mockLocalUser);

      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'mock_google_token_customer@example.com_googleid123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('registered with password login');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return profile details for authenticated customer', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(mockActiveUser);
      const customerToken = jwt.sign(
        { id: mockActiveUser._id, role: 'CUSTOMER' },
        env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('customer@example.com');
      expect(res.body.user.role).toBe('CUSTOMER');
    });

    it('should reject access if token has Admin role', async () => {
      const adminToken = jwt.sign(
        { id: 'some_admin_id', role: 'ADMIN' },
        env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('customer credentials required');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should rotate customer refresh token and return new access token', async () => {
      const mockStoredToken = {
        _id: 'mock_token_id',
        token: 'hashed_refresh_token',
        user: mockActiveUser,
        familyId: 'cust_family_123',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60)
      };

      jest.spyOn(UserRefreshToken, 'findOneAndUpdate').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockStoredToken)
      });
      jest.spyOn(UserRefreshToken, 'create').mockResolvedValue({ token: 'new_token' });

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('X-Admin-Client', 'true')
        .set('Cookie', ['customerRefreshToken=valid_refresh_token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.headers['set-cookie'][0]).toContain('customerRefreshToken');
    });

    it('should block refresh with 403 when CSRF header is missing', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['customerRefreshToken=valid_refresh_token']);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('CSRF protection: missing custom request header');
    });

    it('should revoke family when refresh token reuse is detected', async () => {
      const mockStoredToken = {
        _id: 'mock_token_id',
        token: 'hashed_used_token',
        user: mockActiveUser,
        familyId: 'cust_family_555',
        isUsed: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60)
      };

      jest.spyOn(UserRefreshToken, 'findOneAndUpdate').mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      jest.spyOn(UserRefreshToken, 'findOne').mockResolvedValue(mockStoredToken);
      const deleteSpy = jest.spyOn(UserRefreshToken, 'deleteMany').mockResolvedValue({ deletedCount: 3 });

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('X-Admin-Client', 'true')
        .set('Cookie', ['customerRefreshToken=already_used_refresh_token']);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid session refresh token');
      expect(deleteSpy).toHaveBeenCalledWith({ familyId: 'cust_family_555' });
    });
  });

  describe('Forgot and Reset Password flows', () => {
    it('should perform forgot password, reset password, and revoke active sessions', async () => {
      const mockUser = createMockUserDoc({
        resetPasswordToken: null,
        resetPasswordExpire: null
      });

      // 1. Forgot password
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);
      let res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'customer@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('resetToken'); // Present in test environment
      
      const resetToken = res.body.resetToken;
      expect(mockUser.resetPasswordToken).not.toBeNull();
      expect(mockUser.resetPasswordExpire).toBeInstanceOf(Date);

      // 2. Reset password
      mockFindOneUser(mockUser); // resolve for resetPassword query
      const deleteSessionsSpy = jest.spyOn(UserRefreshToken, 'deleteMany').mockResolvedValue({ deletedCount: 5 });

      res = await request(app)
        .post('/api/auth/reset-password')
        .set('X-Admin-Client', 'true')
        .send({ token: resetToken, password: 'NewCustomerPassword123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Password reset successfully');
      expect(deleteSessionsSpy).toHaveBeenCalledWith({ user: mockUser._id });
    });

    it('should reset password successfully even without CSRF custom headers', async () => {
      const mockUser = createMockUserDoc({
        resetPasswordToken: 'mock_hashed_token',
        resetPasswordExpire: new Date(Date.now() + 10 * 60 * 1000)
      });
      mockFindOneUser(mockUser);
      jest.spyOn(UserRefreshToken, 'deleteMany').mockResolvedValue({ deletedCount: 1 });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'mock_token', password: 'NewCustomerPassword123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Customer Lockout Protection', () => {
    it('should lock the account after 5 failed login attempts', async () => {
      const mockUserDoc = createMockUserDoc();
      mockFindOneUser(mockUserDoc);

      for (let i = 0; i < 4; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'customer@example.com', password: 'WrongPassword' });
      }
      expect(mockUserDoc.failedLoginAttempts).toBe(4);
      expect(mockUserDoc.lockoutUntil).toBeNull();

      // 5th failure
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'customer@example.com', password: 'WrongPassword' });
      
      expect(mockUserDoc.failedLoginAttempts).toBe(5);
      expect(mockUserDoc.lockoutUntil).toBeInstanceOf(Date);

      // Reset rate limit for test
      if (customerLoginRateLimiter && typeof customerLoginRateLimiter.resetKey === 'function') {
        await customerLoginRateLimiter.resetKey('127.0.0.1');
        await customerLoginRateLimiter.resetKey('::ffff:127.0.0.1');
        await customerLoginRateLimiter.resetKey('::1');
      }

      // Locked out
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'customer@example.com', password: 'CustomerPassword123' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });
});
