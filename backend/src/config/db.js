import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';
import Service from '../models/Service.js';
import Admin from '../models/Admin.js';

let mongoServerInstance = null;

const seedServices = async () => {
  try {
    const count = await Service.countDocuments();
    if (count === 0) {
      await Service.create([
        {
          code: 'start',
          name: 'Start Where You Are',
          description: 'An introductory session to map out your core roadblocks.',
          price: 99,
          calendlyUrl: 'https://calendly.com/consultant/start',
          isActive: true
        },
        {
          code: 'clarity',
          name: 'Clarity Call',
          description: 'Deep-dive session focusing on resolving a specific transition or choice.',
          price: 149,
          calendlyUrl: 'https://calendly.com/consultant/clarity',
          isActive: true
        },
        {
          code: 'reset',
          name: 'Reset Programme',
          description: 'Comprehensive coaching framework over 4 weeks to rebuild core routines.',
          price: 499,
          calendlyUrl: 'https://calendly.com/consultant/reset',
          isActive: true
        },
        {
          code: 'couples',
          name: 'Couples\' Conversations',
          description: 'Mediated communication strategy session for alignment and resolution.',
          price: 249,
          calendlyUrl: 'https://calendly.com/consultant/couples',
          isActive: true
        }
      ]);
      logger.info('Database seeded with default authoritative services.');
    }
  } catch (error) {
    logger.error(`Error seeding default services: ${error.message}`);
  }
};

const seedDefaultAdmin = async () => {
  if (env.NODE_ENV === 'production') {
    return;
  }

  const email = process.env.SEED_ADMIN_EMAIL;
  const adminId = process.env.SEED_ADMIN_ID;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || 'Development Administrator';

  if (!email || !adminId || !password) {
    logger.info('Skipping admin seeding: Seed credentials (SEED_ADMIN_EMAIL, SEED_ADMIN_ID, SEED_ADMIN_PASSWORD) are not fully defined.');
    return;
  }

  try {
    const existingAdmin = await Admin.findOne({
      $or: [{ email: email.trim().toLowerCase() }, { adminId: adminId.trim().toLowerCase() }]
    });

    if (existingAdmin) {
      const targetEmail = email.trim().toLowerCase();
      if (existingAdmin.email !== targetEmail || (existingAdmin.name && existingAdmin.name !== name) || (existingAdmin.password && existingAdmin.password !== password)) {
        if (typeof existingAdmin.save === 'function') {
          existingAdmin.email = targetEmail;
          existingAdmin.password = password;
          existingAdmin.name = name;
          existingAdmin.isActive = true;
          await existingAdmin.save();
        } else {
          await Admin.updateOne(
            { _id: existingAdmin._id },
            {
              $set: {
                email: targetEmail,
                password: password,
                name: name,
                isActive: true
              }
            }
          );
        }
        logger.info(`Updated existing Admin account: ${email} / ${adminId}`);
      }
    } else {
      const activeAdmin = new Admin({
        email: email.trim().toLowerCase(),
        adminId: adminId.trim().toLowerCase(),
        password: password,
        name: name,
        isActive: true
      });
      await activeAdmin.save();
      logger.info(`Seeded initial Admin account successfully: ${email} / ${adminId}`);
    }
  } catch (error) {
    logger.error(`Error seeding default admin: ${error.message}`);
  }
};

export const connectDB = async () => {
  try {
    // Suppress mongoose strictQuery deprecation warning
    mongoose.set('strictQuery', true);

    let conn;
    try {
      conn = await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      if (env.NODE_ENV === 'production') {
        throw error;
      }
      logger.warn(`⚠️ Local MongoDB connection refused (${error.message}). Starting in-memory MongoDB server for development...`);
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoServerInstance = await MongoMemoryServer.create();
      const mongoUri = mongoServerInstance.getUri();
      conn = await mongoose.connect(mongoUri);
      logger.info(`MongoDB Connected (In-Memory): ${conn.connection.host}`);
    }

    // Seed default service catalog if empty
    await seedServices();

    // Auto-seed default admin credentials if running in development/testing environments
    await seedDefaultAdmin();

    return conn;
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    if (env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully');
    if (mongoServerInstance) {
      await mongoServerInstance.stop();
      logger.info('In-memory MongoDB server stopped');
    }
  } catch (error) {
    logger.error(`Error during MongoDB disconnection: ${error.message}`);
  }
};

