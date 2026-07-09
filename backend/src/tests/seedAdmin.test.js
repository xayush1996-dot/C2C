import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import Service from '../models/Service.js';
import TrainingVideo from '../models/TrainingVideo.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

describe('seedAdmin script security and correctness tests', () => {
  let originalEnv;
  let processExitSpy;
  let connectSpy;
  let disconnectSpy;
  let countDocumentsSpy;

  beforeEach(() => {
    jest.restoreAllMocks();

    // Backup environment variables
    originalEnv = { ...process.env };
    
    // Set dummy valid values for required variables to pass envSchema validation in non-prod mode
    process.env.MONGO_URI = 'mongodb://localhost:27017/test_db';
    process.env.JWT_SECRET = 'testsecretjwt';
    process.env.JWT_REFRESH_SECRET = 'testsecretjwtrefresh';

    // Mock process.exit to prevent test runner from exiting
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit called with ${code}`);
    });

    // Mock mongoose methods so seedAdmin doesn't talk to actual DB
    connectSpy = jest.spyOn(mongoose, 'connect').mockResolvedValue({
      connection: { host: 'mocked-mongodb' }
    });
    disconnectSpy = jest.spyOn(mongoose, 'disconnect').mockResolvedValue(true);
    countDocumentsSpy = jest.spyOn(Service, 'countDocuments').mockResolvedValue(3);
    jest.spyOn(TrainingVideo, 'countDocuments').mockResolvedValue(5);
    jest.spyOn(User, 'countDocuments').mockResolvedValue(1);
  });

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  const runSeedScript = async () => {
    // Use dynamic import with a unique query string to bypass ES module caching
    // and force the module to execute again with the new environment variables
    const uniqueQuery = `?t=${Date.now()}-${Math.random()}`;
    await import(`../scripts/seedAdmin.js${uniqueQuery}`);
  };

  it('should block execution in production mode', async () => {
    process.env.NODE_ENV = 'production';
    
    // Set seed credentials
    process.env.SEED_ADMIN_EMAIL = 'admin@example.com';
    process.env.SEED_ADMIN_ID = 'admin01';
    process.env.SEED_ADMIN_PASSWORD = 'Password123';

    // Supply valid production values to pass env.js validation
    process.env.GOOGLE_CLIENT_ID = 'real_google_client_id_98765';
    process.env.RAZORPAY_KEY_ID = 'rzp_live_realKeyId123';
    process.env.RAZORPAY_KEY_SECRET = 'realKeySecret456';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'realWebhookSecret789';
    process.env.CALENDLY_WEBHOOK_SECRET = 'realCalendlyWebhookSecret123';
    process.env.CORS_ORIGIN = 'https://c2c.consulting.com';
    process.env.EMAIL_USER = 'real_email_user@gmail.com';
    process.env.EMAIL_PASS = 'real_email_pass_1234';

    await expect(runSeedScript()).rejects.toThrow('process.exit called with 1');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should exit safely if required seed credentials are missing', async () => {
    process.env.NODE_ENV = 'development';
    
    // Missing password
    process.env.SEED_ADMIN_EMAIL = 'admin@example.com';
    process.env.SEED_ADMIN_ID = 'admin01';
    delete process.env.SEED_ADMIN_PASSWORD;

    await expect(runSeedScript()).rejects.toThrow('process.exit called with 1');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should create an admin if required environment variables are set and admin does not exist', async () => {
    process.env.NODE_ENV = 'development';
    process.env.SEED_ADMIN_EMAIL = 'newseedadmin@example.com';
    process.env.SEED_ADMIN_ID = 'seedadmin01';
    process.env.SEED_ADMIN_PASSWORD = 'SafePassword123';

    // Mock Admin.findOne to return null (admin doesn't exist)
    jest.spyOn(Admin, 'findOne').mockResolvedValue(null);
    
    // Mock Admin.prototype.save
    const saveSpy = jest.spyOn(Admin.prototype, 'save').mockResolvedValue({});

    await expect(runSeedScript()).rejects.toThrow('process.exit called with 0');
    
    expect(saveSpy).toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should skip creation if admin already exists to prevent duplicates', async () => {
    process.env.NODE_ENV = 'development';
    process.env.SEED_ADMIN_EMAIL = 'existingseedadmin@example.com';
    process.env.SEED_ADMIN_ID = 'seedadmin02';
    process.env.SEED_ADMIN_PASSWORD = 'SafePassword123';

    // Mock Admin.findOne to return an existing admin document
    jest.spyOn(Admin, 'findOne').mockResolvedValue({
      email: 'existingseedadmin@example.com',
      adminId: 'seedadmin02',
      password: 'mocked_password_hash'
    });
    
    jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);
    const saveSpy = jest.spyOn(Admin.prototype, 'save');

    await expect(runSeedScript()).rejects.toThrow('process.exit called with 0');
    
    expect(saveSpy).not.toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });
});
