import { connectDB, disconnectDB } from '../config/db.js';
import Admin from '../models/Admin.js';
import { logger } from '../config/logger.js';

const seedAdmins = async () => {
  try {
    // Open connection
    await connectDB();

    // Reset admin collections to keep seed idempotent
    await Admin.deleteMany({});
    logger.info('Cleared existing Admin collections.');

    // Seed Active Admin
    const activeAdmin = new Admin({
      email: 'admin@example.com',
      adminId: 'admin01',
      password: 'AdminPassword123',
      name: 'Active Administrator',
      isActive: true
    });
    await activeAdmin.save();
    logger.info('Seeded Active Admin: admin@example.com / admin01');

    // Seed Disabled Admin
    const disabledAdmin = new Admin({
      email: 'disabled@example.com',
      adminId: 'admin02',
      password: 'AdminPassword123',
      name: 'Deactivated Administrator',
      isActive: false
    });
    await disabledAdmin.save();
    logger.info('Seeded Disabled Admin: disabled@example.com / admin02');

    await disconnectDB();
    logger.info('Seeding finished successfully.');
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding operation failed: ${error.message}`);
    process.exit(1);
  }
};

seedAdmins();
