import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { logger } from '../config/logger.js';
import Service from '../models/Service.js';
import TrainingVideo from '../models/TrainingVideo.js';
import User from '../models/User.js';

// Mock mongodb-memory-server so tests run instantly and never attempt large binary downloads during test execution
const mockCreate = jest.fn().mockResolvedValue({
  getUri: () => 'mongodb://localhost:27017/mock_inmemory_db',
  stop: jest.fn().mockResolvedValue(true)
});

jest.unstable_mockModule('mongodb-memory-server', () => ({
  MongoMemoryServer: {
    create: mockCreate
  }
}));

describe('Database Connection Fallback and Production Fail-Fast Tests', () => {
  let originalEnv;
  let processExitSpy;
  let loggerErrorSpy;
  let loggerWarnSpy;
  let connectSpy;

  beforeEach(() => {
    jest.restoreAllMocks();
    originalEnv = { ...process.env };

    // Set default test variables
    process.env.MONGO_URI = 'mongodb://localhost:27017/test_db';
    process.env.JWT_SECRET = 'testsecretjwt12345';
    process.env.JWT_REFRESH_SECRET = 'testsecretjwtrefresh12345';

    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit called with ${code}`);
    });

    loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
    loggerWarnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});

    jest.spyOn(Service, 'countDocuments').mockResolvedValue(3);
    jest.spyOn(TrainingVideo, 'countDocuments').mockResolvedValue(5);
    jest.spyOn(User, 'countDocuments').mockResolvedValue(1);
    mockCreate.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  const getDB = async () => {
    const uniqueQuery = `?t=${Date.now()}-${Math.random()}`;
    return await import(`../config/db.js${uniqueQuery}`);
  };

  it('production Atlas failure never starts MongoMemoryServer and fails fast (process.exit(1))', async () => {
    process.env.NODE_ENV = 'production';
    process.env.GOOGLE_CLIENT_ID = 'real_google_client_id_98765';
    process.env.RAZORPAY_KEY_ID = 'rzp_live_realKeyId123';
    process.env.RAZORPAY_KEY_SECRET = 'realKeySecret456';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'realWebhookSecret789';
    process.env.CALENDLY_WEBHOOK_SECRET = 'realCalendlyWebhookSecret123';
    process.env.CORS_ORIGIN = 'https://c2c.consulting.com';
    process.env.EMAIL_USER = 'real_email_user@gmail.com';
    process.env.EMAIL_PASS = 'real_email_pass_1234';

    connectSpy = jest.spyOn(mongoose, 'connect').mockRejectedValueOnce(new Error('MongooseServerSelectionError: connect ECONNREFUSED'));

    const { connectDB } = await getDB();
    await expect(connectDB()).rejects.toThrow('process.exit called with 1');

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Database connection error in production/non-dev mode: MongooseServerSelectionError: connect ECONNREFUSED')
    );
    expect(loggerWarnSpy).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('non-permitted environment (e.g. staging) never starts MongoMemoryServer on connection failure', async () => {
    process.env.NODE_ENV = 'staging';

    connectSpy = jest.spyOn(mongoose, 'connect').mockRejectedValueOnce(new Error('Staging DB down'));

    const { connectDB } = await getDB();
    await expect(connectDB()).rejects.toThrow('process.exit called with 1');

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Database connection error in production/non-dev mode: Staging DB down')
    );
    expect(loggerWarnSpy).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('test environment allows fallback if primary connection fails and preserves test execution without process.exit', async () => {
    process.env.NODE_ENV = 'test';

    // First call to mongoose.connect fails, second call (to in-memory URI) succeeds
    connectSpy = jest.spyOn(mongoose, 'connect')
      .mockRejectedValueOnce(new Error('Local test Mongo connection refused'))
      .mockResolvedValueOnce({ connection: { host: 'mocked-memory-mongodb' } });

    const { connectDB } = await getDB();
    await connectDB();

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Starting in-memory MongoDB server for development')
    );
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(processExitSpy).not.toHaveBeenCalled();
  }, 20000);

  it('development environment explicitly allows intentional MongoMemoryServer fallback', async () => {
    process.env.NODE_ENV = 'development';

    connectSpy = jest.spyOn(mongoose, 'connect')
      .mockRejectedValueOnce(new Error('No local mongo'))
      .mockResolvedValueOnce({ connection: { host: 'mocked-dev-memory-mongodb' } });

    const { connectDB } = await getDB();
    await connectDB();

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('⚠️ Local MongoDB connection refused')
    );
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(processExitSpy).not.toHaveBeenCalled();
  }, 20000);
});
