import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import User from '../models/User.js';
import UserRefreshToken from '../models/UserRefreshToken.js';
import app from '../app.js';

describe('Auth Hardening Tests (M-2 & M-4)', () => {
  let originalWorkerId;

  beforeEach(() => {
    originalWorkerId = process.env.JEST_WORKER_ID;
    jest.restoreAllMocks();
  });

  afterEach(() => {
    process.env.JEST_WORKER_ID = originalWorkerId;
  });

  const createMockUserDoc = (overrides = {}) => {
    const doc = {
      _id: '6688c1f5f2424b335c0a2a01',
      email: 'customer@example.com',
      password: 'hashedpassword123',
      name: 'John Doe',
      role: 'CUSTOMER',
      googleId: undefined,
      resetPasswordToken: null,
      resetPasswordExpire: null,
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(doc);
      }),
      ...overrides
    };
    return doc;
  };

  describe('M-2: Google Mock Token Bypass Hardening', () => {
    it('should allow mock Google token verification when running in JEST context', async () => {
      // Set to test worker context
      process.env.JEST_WORKER_ID = '1';
      
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'create').mockImplementation((data) => {
        return Promise.resolve(createMockUserDoc({
          email: data.email,
          name: data.name,
          googleId: data.googleId
        }));
      });
      jest.spyOn(UserRefreshToken, 'create').mockResolvedValue({ token: 'mocktoken' });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'mock_google_token_newuser@example.com_googleid999' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('newuser@example.com');
    });

    it('should reject mock Google token verification when JEST_WORKER_ID is not present', async () => {
      // Simulate normal Node process running in test env (e.g. without Jest worker)
      delete process.env.JEST_WORKER_ID;

      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'mock_google_token_newuser@example.com_googleid999' });

      // Should attempt real Google validation, fail on mock token, and return 400
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid Google token signature or validation failure');
    });
  });

  describe('M-4: Password Reset Token Exposure Hardening', () => {
    it('should return reset token in response when running in JEST context', async () => {
      process.env.JEST_WORKER_ID = '1';

      const mockUser = createMockUserDoc();
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'customer@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('resetToken');
    });

    it('should NOT return reset token in response when JEST_WORKER_ID is not present', async () => {
      delete process.env.JEST_WORKER_ID;

      const mockUser = createMockUserDoc();
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'customer@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).not.toHaveProperty('resetToken');
    });
  });
});
