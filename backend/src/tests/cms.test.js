import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import Content from '../models/Content.js';
import Service from '../models/Service.js';
import Admin from '../models/Admin.js';
import { env } from '../config/env.js';

describe('CMS and Service API Endpoints Tests', () => {
  const mockAdminId = '60a9b88e89f81a7b88981e4b';
  const mockServiceId = '60a9b88e89f81a7b88981e4c';

  const mockAdminUser = {
    _id: mockAdminId,
    email: 'admin@example.com',
    adminId: 'admin01',
    name: 'Active Administrator',
    isActive: true
  };

  const generateAdminToken = (adminId = mockAdminId) => {
    return jwt.sign({ id: adminId, role: 'ADMIN' }, env.JWT_SECRET, { expiresIn: '15m' });
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(Admin, 'findById').mockResolvedValue(mockAdminUser);
  });

  describe('GET /api/content', () => {
    it('should retrieve all content formatted as a key-value map', async () => {
      const mockDocs = [
        { key: 'hero_title', value: 'Confusion to Clarity' },
        { key: 'hero_subtitle', value: 'Strategic Coaching' }
      ];
      jest.spyOn(Content, 'find').mockResolvedValue(mockDocs);

      const res = await request(app).get('/api/content');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.content.hero_title).toBe('Confusion to Clarity');
      expect(res.body.content.hero_subtitle).toBe('Strategic Coaching');
    });
  });

  describe('GET /api/services', () => {
    it('should retrieve list of active services', async () => {
      const mockServices = [
        { _id: mockServiceId, code: 'start', name: 'Start session', price: 99 }
      ];
      jest.spyOn(Service, 'find').mockResolvedValue(mockServices);

      const res = await request(app).get('/api/services');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.services[0].name).toBe('Start session');
      expect(res.body.services[0].price).toBe(99);
    });
  });

  describe('PUT /api/admin/content', () => {
    it('should reject requests without a valid Admin token', async () => {
      const res = await request(app)
        .put('/api/admin/content')
        .send({ key: 'hero_title', value: 'New title' });

      expect(res.status).toBe(401);
    });

    it('should successfully update content when admin token is provided', async () => {
      const adminToken = generateAdminToken();
      jest.spyOn(Content, 'findOneAndUpdate').mockResolvedValue({
        key: 'hero_title',
        value: 'New title'
      });

      const res = await request(app)
        .put('/api/admin/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ key: 'hero_title', value: 'New title' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.value).toBe('New title');
    });

    it('should reject if key or value is missing', async () => {
      const adminToken = generateAdminToken();

      const res = await request(app)
        .put('/api/admin/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ key: 'hero_title' });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/admin/services/:id', () => {
    it('should reject service pricing updates without admin token', async () => {
      const res = await request(app)
        .put(`/api/admin/services/${mockServiceId}`)
        .send({ price: 150 });

      expect(res.status).toBe(401);
    });

    it('should successfully update service pricing when valid admin token is provided', async () => {
      const adminToken = generateAdminToken();
      const mockServiceDoc = {
        _id: mockServiceId,
        name: 'Clarity Call',
        price: 149,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(Service, 'findById').mockResolvedValue(mockServiceDoc);

      const res = await request(app)
        .put(`/api/admin/services/${mockServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 199, name: 'Clarity Premium' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockServiceDoc.price).toBe(199);
      expect(mockServiceDoc.name).toBe('Clarity Premium');
    });

    it('should reject update if price is invalid or negative', async () => {
      const adminToken = generateAdminToken();
      const mockServiceDoc = {
        _id: mockServiceId,
        name: 'Clarity Call',
        price: 149
      };

      jest.spyOn(Service, 'findById').mockResolvedValue(mockServiceDoc);

      const res = await request(app)
        .put(`/api/admin/services/${mockServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: -50 });

      expect(res.status).toBe(400);
    });
  });
});
