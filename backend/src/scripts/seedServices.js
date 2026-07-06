import { connectDB, disconnectDB } from '../config/db.js';
import Service from '../models/Service.js';
import Content from '../models/Content.js';
import { logger } from '../config/logger.js';

const defaultContent = [
  { key: 'hero_title', value: 'From Confusion to Clarity' },
  { key: 'hero_subtitle', value: 'Premium strategic coaching for high-impact leaders, founders, and couples navigating pivotal life transitions.' },
  { key: 'founder_name', value: 'Sarah Lin' },
  { key: 'founder_bio', value: 'A former corporate strategist turned high-performance coach, Sarah has spent the last 15 years guiding leaders through intense personal and professional pivots. Her methodology blends logical frameworks with deep emotional intelligence to help clients build long-term, sustainable life clarity.' },
  { key: 'track_record_years', value: '5,000+' },
  { key: 'track_record_leaders', value: '150+' },
  { key: 'track_record_retention', value: '95%' },
  { key: 'track_record_success', value: '99%' }
];

const defaultServices = [
  {
    code: 'start',
    name: 'Start Where You Are',
    description: 'Uncover core roadblocks and mapping templates.',
    price: 99,
    calendlyUrl: 'https://calendly.com/mock-c2c/start-session',
    isActive: true
  },
  {
    code: 'clarity',
    name: 'Clarity Call',
    description: 'Deep-dive resolution of a single major transition.',
    price: 149,
    calendlyUrl: 'https://calendly.com/mock-c2c/clarity-session',
    isActive: true
  },
  {
    code: 'reset',
    name: 'Reset Programme',
    description: 'Rebuild routines and patterns over 4 weeks.',
    price: 499,
    calendlyUrl: 'https://calendly.com/mock-c2c/reset-session',
    isActive: true
  },
  {
    code: 'couples',
    name: "Couples' Conversations",
    description: 'Align goals and co-create relationship strategy blueprints.',
    price: 249,
    calendlyUrl: 'https://calendly.com/mock-c2c/couples-session',
    isActive: true
  }
];

const seedServicesAndContent = async () => {
  try {
    await connectDB();

    // 1. Seed Content Keys
    for (const item of defaultContent) {
      await Content.findOneAndUpdate(
        { key: item.key },
        { value: item.value },
        { upsert: true, new: true }
      );
    }
    logger.info('Website text content successfully seeded.');

    // 2. Seed Services
    for (const srv of defaultServices) {
      await Service.findOneAndUpdate(
        { code: srv.code },
        srv,
        { upsert: true, new: true }
      );
    }
    logger.info('Website services successfully seeded.');

    await disconnectDB();
    logger.info('CMS Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error(`CMS Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedServicesAndContent();
