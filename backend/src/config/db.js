import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';
import Service from '../models/Service.js';
import Admin from '../models/Admin.js';
import TrainingVideo from '../models/TrainingVideo.js';

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
          duration: '60 Mins',
          price: 99,
          calendlyUrl: 'https://calendly.com/consultant/start',
          isActive: true
        },
        {
          code: 'clarity',
          name: 'Clarity Call',
          description: 'Deep-dive session focusing on resolving a specific transition or choice.',
          duration: '45 Mins',
          price: 149,
          calendlyUrl: 'https://calendly.com/consultant/clarity',
          isActive: true
        },
        {
          code: 'reset',
          name: 'Reset Programme',
          description: 'Comprehensive coaching framework over 4 weeks to rebuild core routines.',
          duration: '4 Weeks',
          price: 499,
          calendlyUrl: 'https://calendly.com/consultant/reset',
          isActive: true
        },
        {
          code: 'couples',
          name: 'Couples\' Conversations',
          description: 'Mediated communication strategy session for alignment and resolution.',
          duration: '90 Mins',
          price: 249,
          calendlyUrl: 'https://calendly.com/consultant/couples',
          isActive: true
        },
        {
          code: 'premium_videos',
          name: 'Premium Video Access Tier',
          description: 'Lifetime access to the full C2C premium video masterclass archive and training tools.',
          duration: 'Lifetime',
          price: 1999,
          calendlyUrl: 'https://calendly.com/mock-c2c/premium-videos',
          isActive: true
        }
      ]);
      logger.info('Database seeded with default authoritative services.');
    }
  } catch (error) {
    logger.error(`Error seeding default services: ${error.message}`);
  }
};

const seedTrainingVideos = async () => {
  try {
    const count = await TrainingVideo.countDocuments();
    if (count === 0) {
      await TrainingVideo.create([
        {
          title: "Navigating Partners' Stagnation",
          category: "Couples & Business",
          duration: "4:15",
          description: "Three structural triggers that lead to joint business partner paralysis and how to unlock dialogue.",
          thumbnailUrl: "/video_thumbnails/partners_stagnation.png",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
        },
        {
          title: "The 3-Second Boundary Check",
          category: "Professional Reset",
          duration: "2:40",
          description: "A practical framework for high-burnout environments to evaluate requests before committing.",
          thumbnailUrl: "/video_thumbnails/boundary_check.png",
          videoUrl: "https://www.w3schools.com/html/movie.mp4"
        },
        {
          title: "De-escalation in High Stakes",
          category: "Communication Strategy",
          duration: "5:10",
          description: "Managing cortisol responses and communication patterns during active professional transitions.",
          thumbnailUrl: "/video_thumbnails/high_stakes.png",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
        },
        {
          title: "Strategic Positioning & Authority Signaling",
          category: "Corporate Dominance",
          duration: "6:30",
          description: "Advanced techniques for establishing presence, controlling rooms, and projecting administrative authority.",
          thumbnailUrl: "/video_thumbnails/authority_signaling.png",
          videoUrl: "https://www.w3schools.com/html/movie.mp4"
        },
        {
          title: "Designing Escape Hatches in Contracts",
          category: "Legal Boundaries",
          duration: "8:15",
          description: "Understanding legal thresholds and how to structure service terms to maximize flexibility and safety.",
          thumbnailUrl: "/video_thumbnails/escape_hatches.png",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
        }
      ]);
      logger.info('Database seeded with default training video clips.');
    }
  } catch (error) {
    logger.error(`Error seeding default training videos: ${error.message}`);
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
      conn = await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 500 });
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

    // Seed default training videos if empty
    await seedTrainingVideos();

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

