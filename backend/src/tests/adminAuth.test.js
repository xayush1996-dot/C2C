import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Admin from '../models/Admin.js';
import RefreshToken from '../models/RefreshToken.js';
import app from '../app.js';
import { env } from '../config/env.js';
import { loginRateLimiter } from '../middleware/rateLimiter.js';

describe('Admin Authentication System Tests', () => {
  // Helper to create mock Mongoose Admin documents
  const createMockAdminDoc = (overrides = {}) => {
    const doc = {
      _id: '6688b1f5f2424b335c0a1a01',
      email: 'admin@example.com',
      adminId: 'admin01',
      password: 'hashedpassword123',
      name: 'Active Administrator',
      isActive: true,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      comparePassword: async (pwd) => pwd === 'AdminPassword123',
      ...overrides
    };
    // Implement save as a mock function returning resolved promise of this document
    doc.save = jest.fn().mockImplementation(function () {
      return Promise.resolve(doc);
    });
    return doc;
  };

  const mockActiveAdmin = createMockAdminDoc({
    email: 'admin@example.com',
    adminId: 'admin01',
    name: 'Active Administrator',
    isActive: true
  });

  const mockDisabledAdmin = createMockAdminDoc({
    email: 'disabled@example.com',
    adminId: 'admin02',
    name: 'Deactivated Administrator',
    isActive: false
  });

  // Helper to mock chainable select method on Admin.findOne
  const mockFindOne = (resolvedValue) => {
    return jest.spyOn(Admin, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(resolvedValue)
    });
  };

  beforeEach(async () => {
    jest.restoreAllMocks();
    if (loginRateLimiter && typeof loginRateLimiter.resetKey === 'function') {
      await loginRateLimiter.resetKey('127.0.0.1');
      await loginRateLimiter.resetKey('::ffff:127.0.0.1');
      await loginRateLimiter.resetKey('::1');
    }
  });

  describe('POST /api/admin/auth/login', () => {
    it('should authenticate successfully with valid email and password', async () => {
      mockFindOne(mockActiveAdmin);
      jest.spyOn(RefreshToken, 'create').mockResolvedValue({ token: 'mocktoken' });

      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ loginId: 'admin@example.com', password: 'AdminPassword123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.admin.email).toBe('admin@example.com');
      expect(res.headers['set-cookie'][0]).toContain('refreshToken');
    });

    it('should authenticate successfully with valid adminId and password', async () => {
      mockFindOne(mockActiveAdmin);
      jest.spyOn(RefreshToken, 'create').mockResolvedValue({ token: 'mocktoken' });

      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ loginId: 'admin01', password: 'AdminPassword123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.admin.adminId).toBe('admin01');
    });

    it('should ignore any role injected in login payload and always issue admin role token', async () => {
      mockFindOne(mockActiveAdmin);
      jest.spyOn(RefreshToken, 'create').mockResolvedValue({ token: 'mocktoken' });

      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ loginId: 'admin@example.com', password: 'AdminPassword123', role: 'CUSTOMER' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');
      
      const decoded = jwt.verify(res.body.accessToken, env.JWT_SECRET);
      expect(decoded.role).toBe('ADMIN');
    });

    it('should reject login for wrong password', async () => {
      mockFindOne(mockActiveAdmin);

      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ loginId: 'admin@example.com', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Invalid email/admin ID or password');
    });

    it('should reject login for nonexistent admin', async () => {
      mockFindOne(null);

      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ loginId: 'nonexistent@example.com', password: 'SomePassword' });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Invalid email/admin ID or password');
    });

    it('should reject login for disabled admin with correct password with custom error code', async () => {
      mockFindOne(mockDisabledAdmin);

      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ loginId: 'disabled@example.com', password: 'AdminPassword123' });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.errorCode).toBe('ACCOUNT_DISABLED');
      expect(res.body.message).toBe('Administrator account is deactivated');
    });

    it('should reject login for disabled admin with incorrect password with generic error to prevent harvesting', async () => {
      mockFindOne(mockDisabledAdmin);

      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ loginId: 'disabled@example.com', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
      expect(res.body.message).toBe('Invalid email/admin ID or password');
    });
  });

  describe('GET /api/admin/auth/me', () => {
    it('should deny profile access when no token is provided', async () => {
      const res = await request(app).get('/api/admin/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('access token missing');
    });

    it('should deny profile access when token contains wrong role', async () => {
      const customerToken = jwt.sign(
        { id: mockActiveAdmin._id, role: 'CUSTOMER' },
        env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .get('/api/admin/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('admin credentials required');
    });

    it('should return profile details when valid admin token is provided', async () => {
      jest.spyOn(Admin, 'findById').mockResolvedValue(mockActiveAdmin);

      const adminToken = jwt.sign(
        { id: mockActiveAdmin._id, role: 'ADMIN' },
        env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .get('/api/admin/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.admin.email).toBe('admin@example.com');
    });
  });

  describe('POST /api/admin/auth/refresh', () => {
    it('should perform token rotation (RTR) and return a new access token', async () => {
      const mockStoredToken = {
        _id: 'mock_token_id',
        token: 'valid_refresh_token',
        admin: mockActiveAdmin,
        familyId: 'family_123',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60)
      };

      jest.spyOn(RefreshToken, 'findOneAndUpdate').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockStoredToken)
      });
      jest.spyOn(RefreshToken, 'create').mockResolvedValue({ token: 'new_refresh_token' });

      const res = await request(app)
        .post('/api/admin/auth/refresh')
        .set('X-Admin-Client', 'true')
        .set('Cookie', ['refreshToken=valid_refresh_token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.headers['set-cookie'][0]).toContain('refreshToken');
    });
  });

  describe('POST /api/admin/auth/logout', () => {
    it('should delete the refresh token from DB and clear the cookie', async () => {
      jest.spyOn(RefreshToken, 'deleteOne').mockResolvedValue({ deletedCount: 1 });

      const res = await request(app)
        .post('/api/admin/auth/logout')
        .set('X-Admin-Client', 'true')
        .set('Cookie', ['refreshToken=some_refresh_token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie'][0]).toContain('refreshToken=;');
    });
  });

  describe('Rate Limiter Protection', () => {
    it('should trigger rate limit of 429 after 5 failed login attempts', async () => {
      mockFindOne(null);

      // Make 5 login requests (permitted limits)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/admin/auth/login')
          .send({ loginId: 'invalid-attempt', password: 'badpassword' });
      }

      // 6th attempt should trigger the limiter
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ loginId: 'invalid-attempt', password: 'badpassword' });

      expect(res.status).toBe(429);
      expect(res.body.message).toContain('Too many failed login attempts');
    });
  });

  describe('CSRF Custom Header Protection (Regression)', () => {
    it('should reject refresh request with 403 when custom headers are missing', async () => {
      const res = await request(app)
        .post('/api/admin/auth/refresh')
        .set('Cookie', ['refreshToken=some_token']);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('CSRF protection: missing custom request header');
    });

    it('should reject logout request with 403 when custom headers are missing', async () => {
      const res = await request(app)
        .post('/api/admin/auth/logout')
        .set('Cookie', ['refreshToken=some_token']);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('CSRF protection: missing custom request header');
    });
  });

  describe('Account Lockout Protection (Regression)', () => {
    it('should lock the account after 5 failed login attempts and reject subsequent matches', async () => {
      const mockAdminDoc = createMockAdminDoc();
      mockFindOne(mockAdminDoc);

      // Perform first 4 failures
      for (let i = 0; i < 4; i++) {
        await request(app)
          .post('/api/admin/auth/login')
          .send({ loginId: 'admin@example.com', password: 'WrongPassword' });
      }
      expect(mockAdminDoc.failedLoginAttempts).toBe(4);
      expect(mockAdminDoc.lockoutUntil).toBeNull();

      // 5th failure triggers lockout
      await request(app)
        .post('/api/admin/auth/login')
        .send({ loginId: 'admin@example.com', password: 'WrongPassword' });
      
      expect(mockAdminDoc.failedLoginAttempts).toBe(5);
      expect(mockAdminDoc.lockoutUntil).toBeInstanceOf(Date);
      expect(mockAdminDoc.lockoutUntil.getTime()).toBeGreaterThan(Date.now());

      // Reset the rate limit so the 6th request doesn't get blocked by the IP rate limiter
      if (loginRateLimiter && typeof loginRateLimiter.resetKey === 'function') {
        await loginRateLimiter.resetKey('127.0.0.1');
        await loginRateLimiter.resetKey('::ffff:127.0.0.1');
        await loginRateLimiter.resetKey('::1');
      }

      // 6th attempt is rejected because of lockout, even with correct password
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ loginId: 'admin@example.com', password: 'AdminPassword123' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email/admin ID or password');
    });

    it('should reset failedLoginAttempts upon successful login', async () => {
      const mockAdminDoc = createMockAdminDoc({ failedLoginAttempts: 3 });
      mockFindOne(mockAdminDoc);
      jest.spyOn(RefreshToken, 'create').mockResolvedValue({ token: 'mocktoken' });

      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ loginId: 'admin@example.com', password: 'AdminPassword123' });

      expect(res.status).toBe(200);
      expect(mockAdminDoc.failedLoginAttempts).toBe(0);
      expect(mockAdminDoc.lockoutUntil).toBeUndefined();
    });
  });

  describe('Refresh Token Hashing Protection (Regression)', () => {
    it('should hash the refresh token in the database', async () => {
      const mockAdminDoc = createMockAdminDoc();
      mockFindOne(mockAdminDoc);
      
      const createSpy = jest.spyOn(RefreshToken, 'create').mockResolvedValue({ token: 'mocktoken' });

      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ loginId: 'admin@example.com', password: 'AdminPassword123' });

      expect(res.status).toBe(200);
      const callArgs = createSpy.mock.calls[0][0];
      // Hashed token must be 64 character hex (SHA-256)
      expect(callArgs.token).toHaveLength(64);
      expect(callArgs.token).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Refresh Token Theft/Replay & Family Revocation (Regression)', () => {
    it('should revoke all tokens in the family when token reuse is detected', async () => {
      const mockStoredToken = {
        _id: 'mock_token_id',
        token: 'hashed_reused_token',
        admin: mockActiveAdmin,
        familyId: 'stolen_family_123',
        isUsed: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60)
      };

      // findOneAndUpdate returns null because isUsed is already true
      jest.spyOn(RefreshToken, 'findOneAndUpdate').mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      // findOne finds the token (marked as used)
      jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(mockStoredToken);
      
      const deleteManySpy = jest.spyOn(RefreshToken, 'deleteMany').mockResolvedValue({ deletedCount: 2 });

      const res = await request(app)
        .post('/api/admin/auth/refresh')
        .set('X-Admin-Client', 'true')
        .set('Cookie', ['refreshToken=reused_refresh_token']);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid session refresh token');
      expect(deleteManySpy).toHaveBeenCalledWith({ familyId: 'stolen_family_123' });
    });
  });

  describe('Additional Hardening and Regression Tests (Phase 12)', () => {
    it('should handle whitespace around identifier and normalize email casing', async () => {
      mockFindOne(mockActiveAdmin);
      jest.spyOn(RefreshToken, 'create').mockResolvedValue({ token: 'mocktoken' });

      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ loginId: '   ADMIN@EXAMPLE.COM   ', password: 'AdminPassword123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should not modify password whitespace', async () => {
      mockFindOne(mockActiveAdmin);

      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ loginId: 'admin@example.com', password: ' AdminPassword123 ' });

      expect(res.status).toBe(401);
    });

    it('should prevent customer login through admin route', async () => {
      // Customer is not in Admin collection, so query returns null
      mockFindOne(null);

      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ loginId: 'client@example.com', password: 'clientpassword' });

      expect(res.status).toBe(401);
    });

    it('should verify password select(+password) is present in query', async () => {
      const findSpy = jest.spyOn(Admin, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockActiveAdmin)
      });

      await request(app)
        .post('/api/admin/auth/login')
        .send({ loginId: 'admin@example.com', password: 'AdminPassword123' });

      expect(findSpy).toHaveBeenCalled();
      const selectMock = findSpy.mock.results[0].value.select;
      expect(selectMock).toHaveBeenCalledWith('+password +failedLoginAttempts +lockoutUntil');
    });
  });
});
