import { connectDB, disconnectDB } from '../config/db.js';
import Admin from '../models/Admin.js';

const check = async () => {
  await connectDB();
  const admins = await Admin.find({});
  console.log("Current seeded admins in database:");
  admins.forEach(a => {
    console.log(`- ID: ${a._id}, Email: ${a.email}, AdminID: ${a.adminId}, Name: ${a.name}, IsActive: ${a.isActive}`);
  });
  await disconnectDB();
  process.exit(0);
};

check();
