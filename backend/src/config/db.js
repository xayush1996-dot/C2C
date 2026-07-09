import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from './env.js';
import { logger } from './logger.js';
import Service from '../models/Service.js';
import Admin from '../models/Admin.js';
import TrainingVideo from '../models/TrainingVideo.js';
import User from '../models/User.js';

let mongoServerInstance = null;

export const seedServices = async () => {
  if (mongoose.connection.readyState !== 1) {
    logger.info('Skipping service seeding: MongoDB is not connected.');
    return;
  }
  const defaultServices = [
    {
      code: 'eq',
      name: 'Emotional Intelligence (EQ) & Self-Awareness',
      description: 'Learn to recognize emotional triggers, map cognitive patterns, build self-awareness, and deploy empathetic response systems in corporate and social environments.',
      duration: '60 Mins',
      price: 2999,
      calendlyUrl: 'https://calendly.com/consultant/eq',
      isActive: true
    },
    {
      code: 'public',
      name: 'Public Speaking, Leadership & Confidence Building',
      description: 'Develop high-impact presence, construct persuasive speeches, master body posture, and overcome stage fright to lead teams with ultimate confidence.',
      duration: '90 Mins',
      price: 4999,
      calendlyUrl: 'https://calendly.com/consultant/public',
      isActive: true
    },
    {
      code: 'private',
      name: 'Confidential 1-on-1 Private Mentorship',
      description: 'A completely confidential, dedicated counseling and advisory desk to resolve specific soft-skill blocks, emotional regulation challenges, or public presentation reviews.',
      duration: '45 Mins',
      price: 1499,
      calendlyUrl: 'https://calendly.com/consultant/private',
      isActive: true
    },
    {
      code: 'resume',
      name: 'Resume Overhaul & LinkedIn Optimization',
      description: 'Transform your CV with high-conversion frameworks, optimize your LinkedIn presence, and learn the secret to beating the ATS (Applicant Tracking System) for dream roles.',
      duration: '75 Mins',
      price: 3499,
      calendlyUrl: 'https://calendly.com/consultant/resume',
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
  ];

  try {
    for (const service of defaultServices) {
      await Service.findOneAndUpdate(
        { code: service.code },
        { $setOnInsert: service },
        { upsert: true, new: true }
      );
    }
    logger.info('Database seeded with default authoritative services.');
  } catch (error) {
    logger.error(`Error seeding default services: ${error.message}`);
  }
};

const seedTrainingVideos = async () => {
  if (mongoose.connection.readyState !== 1) {
    logger.info('Skipping training video seeding: MongoDB is not connected.');
    return;
  }
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
  if (mongoose.connection.readyState !== 1) {
    logger.info('Skipping admin seeding: MongoDB is not connected.');
    return;
  }
  const currentEnv = (process.env.NODE_ENV || env.NODE_ENV || 'development').trim().toLowerCase();
  if (currentEnv === 'production' || env.NODE_ENV === 'production') {
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
    }).select('+password');

    if (existingAdmin) {
      const targetEmail = email.trim().toLowerCase();
      const isPasswordSame = existingAdmin.password ? bcrypt.compareSync(password, existingAdmin.password) : false;
      if (existingAdmin.email !== targetEmail || (existingAdmin.name && existingAdmin.name !== name) || !isPasswordSame) {
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

const seedDefaultCustomer = async () => {
  if (mongoose.connection.readyState !== 1) {
    logger.info('Skipping customer seeding: MongoDB is not connected.');
    return;
  }
  const currentEnv = (process.env.NODE_ENV || env.NODE_ENV || 'development').trim().toLowerCase();
  if (currentEnv === 'production' || env.NODE_ENV === 'production') {
    return;
  }
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      await User.create([
        {
          email: 'client@example.com',
          password: 'clientpassword',
          name: 'Sarah Lin',
          role: 'CUSTOMER'
        }
      ]);
      logger.info('Database seeded with default demo customer (client@example.com).');
    }
  } catch (error) {
    logger.error(`Error seeding default customer: ${error.message}`);
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
      const currentEnv = (process.env.NODE_ENV || env.NODE_ENV || 'development').trim().toLowerCase();
      const isPermittedFallbackEnv = currentEnv === 'development' || currentEnv === 'test';
      if (currentEnv === 'production' || !isPermittedFallbackEnv) {
        logger.error(`Database connection error in production/non-dev mode: ${error.message}`);
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

    // Auto-seed default customer/client credentials
    await seedDefaultCustomer();

    return conn;
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    const currentEnv = (process.env.NODE_ENV || env.NODE_ENV || 'development').trim().toLowerCase();
    if (currentEnv !== 'test') {
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

