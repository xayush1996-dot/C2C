import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';
import Service from '../models/Service.js';

const seedServices = async () => {
  try {
    const count = await Service.countDocuments();
    if (count === 0) {
      await Service.create([
        {
          code: 'consulting-1h',
          name: '1-Hour Consulting Call',
          description: '1-Hour one-on-one consulting call with direct advisory.',
          price: 5000,
          calendlyUrl: 'https://calendly.com/consultant/1h',
          isActive: true
        },
        {
          code: 'advisory-startup',
          name: 'Startup Advisory Session',
          description: 'Strategic advisory session tailored for startup founders.',
          price: 15000,
          calendlyUrl: 'https://calendly.com/consultant/startup',
          isActive: true
        },
        {
          code: 'code-review',
          name: 'Full Code Review Package',
          description: 'Deep-dive security, architecture, and quality review of your codebase.',
          price: 30000,
          calendlyUrl: 'https://calendly.com/consultant/code-review',
          isActive: true
        }
      ]);
      logger.info('Database seeded with default authoritative services.');
    }
  } catch (error) {
    logger.error(`Error seeding default services: ${error.message}`);
  }
};

export const connectDB = async () => {
  try {
    // Suppress mongoose strictQuery deprecation warning
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(env.MONGO_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed default service catalog if empty
    await seedServices();
    
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
  } catch (error) {
    logger.error(`Error during MongoDB disconnection: ${error.message}`);
  }
};
