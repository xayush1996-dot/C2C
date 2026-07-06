import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';

describe('API Health and Standard Middleware Tests', () => {
  const setDatabaseState = (state) => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: state,
      configurable: true,
      writable: true
    });
  };

  describe('GET /api/health', () => {
    it('should return 200 and success details when database is connected', async () => {
      setDatabaseState(1);

      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.db.connected).toBe(true);
      expect(res.body.db.state).toBe('connected');
    });

    it('should return 503 and error details when database is disconnected', async () => {
      setDatabaseState(0);

      const res = await request(app).get('/api/health');

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('error');
      expect(res.body.db.connected).toBe(false);
      expect(res.body.db.state).toBe('disconnected');
    });
  });

  describe('404 Request Handler', () => {
    it('should return 404 and fail message for undefined routes', async () => {
      const res = await request(app).get('/api/non-existent-route-path');

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain("Can't find /api/non-existent-route-path on this server!");
    });
  });
});
