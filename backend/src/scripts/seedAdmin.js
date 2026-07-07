import { connectDB, disconnectDB } from '../config/db.js';
import Admin from '../models/Admin.js';
import { logger } from '../config/logger.js';

const seedAdmins = async () => {
  // Block unsafe production execution
  if (process.env.NODE_ENV === 'production') {
    logger.error('Block execution: seedAdmin script is not allowed to run in production mode.');
    process.exit(1);
  }

  const email = process.env.SEED_ADMIN_EMAIL;
  const adminId = process.env.SEED_ADMIN_ID;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || 'Development Administrator';

  if (!email || !adminId || !password) {
    logger.error('Exit safely: Required seed credentials (SEED_ADMIN_EMAIL, SEED_ADMIN_ID, SEED_ADMIN_PASSWORD) are missing.');
    process.exit(1);
  }

  let success = false;
  try {
    // Open connection
    await connectDB();

    // Prevent duplicate admin creation
    const existingAdmin = await Admin.findOne(
      { $or: [{ email: email.trim().toLowerCase() }, { adminId: adminId.trim().toLowerCase() }] },
      '+password'
    );

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
        logger.info(`Updated existing Admin account successfully: ${email} / ${adminId}`);
      } else {
        logger.info(`Admin with email ${email} or adminId ${adminId} already exists and is up to date. Skipping creation.`);
      }
    } else {
      // Seed Active Admin
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

    await disconnectDB();
    logger.info('Seeding finished successfully.');
    success = true;
  } catch (error) {
    logger.error(`Seeding operation failed: ${error.message}`);
    process.exit(1);
  }

  if (success) {
    process.exit(0);
  }
};

await seedAdmins();
