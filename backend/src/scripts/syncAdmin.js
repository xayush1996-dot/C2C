import { connectDB, disconnectDB } from '../config/db.js';
import Admin from '../models/Admin.js';
import { logger } from '../config/logger.js';
import bcrypt from 'bcryptjs';

const syncAdmin = async () => {
  const email = process.env.SEED_ADMIN_EMAIL;
  const adminId = process.env.SEED_ADMIN_ID;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || 'Administrator';

  if (!email || !adminId || !password) {
    logger.error('[Admin Sync] Missing required SEED_ADMIN_EMAIL, SEED_ADMIN_ID, or SEED_ADMIN_PASSWORD environment variables.');
    process.exit(1);
  }

  const targetEmail = email.trim().toLowerCase();
  const targetId = adminId.trim().toLowerCase();

  try {
    logger.info('[Admin Sync] Connecting to the database...');
    await connectDB();
    logger.info('[Admin Sync] Database connected.');

    // 1. Audit database for conflicts
    const allAdmins = await Admin.find({});
    logger.info(`[Admin Sync] Total administrators found in database: ${allAdmins.length}`);

    let matchingAdmin = null;

    // Check for conflicts where email and ID exist on different documents
    const emailMatch = allAdmins.find(a => a.email === targetEmail);
    const idMatch = allAdmins.find(a => a.adminId === targetId);

    if (emailMatch && idMatch && emailMatch._id.toString() !== idMatch._id.toString()) {
      logger.error(`[Admin Sync] Conflict detected: email matches admin ${emailMatch._id} but adminId matches admin ${idMatch._id}. Manual resolution required.`);
      await disconnectDB();
      process.exit(1);
    }

    matchingAdmin = emailMatch || idMatch;

    if (matchingAdmin) {
      logger.info(`[Admin Sync] Matching administrator found: ID prefix ${matchingAdmin.adminId.substring(0, 4)}`);
      
      // Update fields
      matchingAdmin.email = targetEmail;
      matchingAdmin.adminId = targetId;
      matchingAdmin.name = name;
      matchingAdmin.password = password; // Pre-save hook hashes this securely
      matchingAdmin.isActive = true;
      
      await matchingAdmin.save();
      logger.info('[Admin Sync] Identity synchronized. Password updated. Operation complete.');
    } else {
      logger.info('[Admin Sync] No matching administrator found. Creating new admin record...');
      const newAdmin = new Admin({
        email: targetEmail,
        adminId: targetId,
        password: password,
        name: name,
        isActive: true
      });
      await newAdmin.save();
      logger.info('[Admin Sync] New administrator seeded successfully. Operation complete.');
    }

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error(`[Admin Sync] Error executing sync: ${error.message}`);
    try {
      await disconnectDB();
    } catch (_) {}
    process.exit(1);
  }
};

await syncAdmin();
