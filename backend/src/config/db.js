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
