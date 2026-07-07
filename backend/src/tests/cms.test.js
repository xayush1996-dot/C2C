import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import Content from '../models/Content.js';
import Service from '../models/Service.js';
import Admin from '../models/Admin.js';
import TrainingVideo from '../models/TrainingVideo.js';
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
        { _id: mockServiceId, code: 'start', name: 'Start session', price: 99, duration: '60 Mins' }
      ];
      jest.spyOn(Service, 'find').mockResolvedValue(mockServices);

      const res = await request(app).get('/api/services');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.services[0].name).toBe('Start session');
      expect(res.body.services[0].price).toBe(99);
      expect(res.body.services[0].duration).toBe('60 Mins');
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
        duration: '45 Mins',
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(Service, 'findById').mockResolvedValue(mockServiceDoc);

      const res = await request(app)
        .put(`/api/admin/services/${mockServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 199, name: 'Clarity Premium', duration: '90 Mins' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockServiceDoc.price).toBe(199);
      expect(mockServiceDoc.name).toBe('Clarity Premium');
      expect(mockServiceDoc.duration).toBe('90 Mins');
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

  describe('GET /api/videos', () => {
    it('should retrieve videos with isLocked=true and hidden URL if anonymous', async () => {
      const mockVideos = [
        { _id: '60a9b88e89f81a7b88981e4d', title: 'Video 1', category: 'Cat 1', duration: '3:00', description: 'Desc 1', videoUrl: 'http://test.com/1', toObject: function() { return this; } }
      ];
      jest.spyOn(TrainingVideo, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockVideos)
      });

      const res = await request(app).get('/api/videos');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.hasPremiumAccess).toBe(false);
      expect(res.body.videos[0].isLocked).toBe(true);
      expect(res.body.videos[0].videoUrl).toBe('');
    });

    it('should retrieve videos with isLocked=false and full URL if admin', async () => {
      const adminToken = generateAdminToken();
      const mockVideos = [
        { _id: '60a9b88e89f81a7b88981e4d', title: 'Video 1', category: 'Cat 1', duration: '3:00', description: 'Desc 1', videoUrl: 'http://test.com/1', toObject: function() { return this; } }
      ];
      jest.spyOn(TrainingVideo, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockVideos)
      });

      const res = await request(app)
        .get('/api/videos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.hasPremiumAccess).toBe(true);
      expect(res.body.videos[0].isLocked).toBe(false);
      expect(res.body.videos[0].videoUrl).toBe('http://test.com/1');
    });
  });

  describe('GET /api/admin/videos', () => {
    it('should reject access without admin token', async () => {
      const res = await request(app).get('/api/admin/videos');
      expect(res.status).toBe(401);
    });

    it('should successfully return all videos for admin', async () => {
      const adminToken = generateAdminToken();
      const mockVideos = [
        { _id: '60a9b88e89f81a7b88981e4d', title: 'Video 1', category: 'Cat 1', duration: '3:00', description: 'Desc 1', videoUrl: 'http://test.com/1' }
      ];
      jest.spyOn(TrainingVideo, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockVideos)
      });

      const res = await request(app)
        .get('/api/admin/videos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.videos[0].title).toBe('Video 1');
    });
  });

  describe('POST /api/admin/videos', () => {
    it('should create new video when valid admin token is provided', async () => {
      const adminToken = generateAdminToken();
      const newVideo = {
        title: 'New Video',
        category: 'Tech',
        duration: '5:00',
        description: 'New Video Desc',
        videoUrl: 'http://test.com/new'
      };

      jest.spyOn(TrainingVideo, 'create').mockResolvedValue(newVideo);

      const res = await request(app)
        .post('/api/admin/videos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newVideo);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.video.title).toBe('New Video');
    });

    it('should reject creation if required fields are missing', async () => {
      const adminToken = generateAdminToken();
      const res = await request(app)
        .post('/api/admin/videos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Missing fields' });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/admin/videos/:id', () => {
    it('should successfully update video details', async () => {
      const adminToken = generateAdminToken();
      const videoId = '60a9b88e89f81a7b88981e4d';
      const mockVideoDoc = {
        _id: videoId,
        title: 'Old Title',
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(TrainingVideo, 'findById').mockResolvedValue(mockVideoDoc);

      const res = await request(app)
        .put(`/api/admin/videos/${videoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockVideoDoc.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/admin/videos/:identifier', () => {
    it('should delete video by Database ID', async () => {
      const adminToken = generateAdminToken();
      const videoId = '60a9b88e89f81a7b88981e4d';

      jest.spyOn(TrainingVideo, 'findByIdAndDelete').mockResolvedValue({ _id: videoId, title: 'Video Deleted' });

      const res = await request(app)
        .delete(`/api/admin/videos/${videoId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted successfully');
    });

    it('should delete video by Title', async () => {
      const adminToken = generateAdminToken();
      const videoTitle = 'VideoToDelete';

      jest.spyOn(TrainingVideo, 'findOneAndDelete').mockResolvedValue({ _id: '60a9b88e89f81a7b88981e4e', title: videoTitle });

      const res = await request(app)
        .delete(`/api/admin/videos/${videoTitle}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted successfully');
    });
  });
});
