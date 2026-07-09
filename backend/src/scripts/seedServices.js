import { connectDB, disconnectDB } from '../config/db.js';
import Service from '../models/Service.js';
import Content from '../models/Content.js';
import { logger } from '../config/logger.js';

const defaultContent = [
  { key: 'hero_title', value: 'Confusion to Clarity' },
  { key: 'hero_subtitle', value: 'A scientific, 1-on-1 mentorship platform assisting students and professionals in mapping cognitive strengths to top global universities and career paths.' },
  { key: 'founder_name', value: 'Lead EQ Coach & Mentor' },
  { key: 'founder_bio', value: 'Specializing in emotional regulation, public presence, and organizational soft skills, our lead mentors bring direct coaching experience training Indian Oil employees, nursing students, and academic professionals to build resilience and speak with confidence.' },
  { key: 'track_record_years', value: '10,000+' },
  { key: 'track_record_success', value: '98%' },
  { key: 'track_record_retention', value: '₹4.5Cr+' },
  { key: 'track_record_leaders', value: '15+' }
];

const defaultServices = [
  {
    code: 'eq',
    name: 'Emotional Intelligence (EQ) & Self-Awareness',
    description: 'Learn to recognize emotional triggers, map cognitive patterns, build self-awareness, and deploy empathetic response systems in corporate and social environments.',
    duration: '60 Mins',
    price: 2999,
    calendlyUrl: 'https://calendly.com/mock-c2c/eq-session',
    isActive: true
  },
  {
    code: 'public',
    name: 'Public Speaking, Leadership & Confidence Building',
    description: 'Develop high-impact presence, construct persuasive speeches, master body posture, and overcome stage fright to lead teams with ultimate confidence.',
    duration: '90 Mins',
    price: 4999,
    calendlyUrl: 'https://calendly.com/mock-c2c/public-speaking',
    isActive: true
  },
  {
    code: 'private',
    name: 'Confidential 1-on-1 Private Mentorship',
    description: 'A completely confidential, dedicated counseling and advisory desk to resolve specific soft-skill blocks, emotional regulation challenges, or public presentation reviews.',
    duration: '45 Mins',
    price: 1499,
    calendlyUrl: 'https://calendly.com/mock-c2c/private-mentorship',
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

const seedServicesAndContent = async () => {
  try {
    await connectDB();

    // 1. Seed Content Keys
    await Content.deleteMany({});
    for (const item of defaultContent) {
      await Content.create(item);
    }
    logger.info('Website text content successfully seeded.');

    // 2. Seed Services
    await Service.deleteMany({});
    for (const srv of defaultServices) {
      await Service.create(srv);
    }
    logger.info('Website services successfully seeded.');

    // 3. Seed Admin Account
    const Admin = (await import('../models/Admin.js')).default;
    const defaultAdminEmail = 'confusiontoclarity7@gmail.com';
    const existingAdmin = await Admin.findOne({ email: defaultAdminEmail });
    if (!existingAdmin) {
      await Admin.create({
        email: defaultAdminEmail,
        adminId: 'admin_c2c',
        password: 'Confusion@2026',
        name: 'Lead Admin',
        isActive: true
      });
      logger.info('Default Admin account seeded successfully.');
    }

    await disconnectDB();
    logger.info('CMS Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error(`CMS Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedServicesAndContent();
