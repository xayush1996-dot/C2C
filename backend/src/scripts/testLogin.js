import { connectDB, disconnectDB } from '../config/db.js';
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';

const test = async () => {
  await connectDB();
  const email = "confusiontoclarity@gmail.com";
  const password = "AdminPassword123";

  console.log(`Querying admin with email: ${email}`);
  const admin = await Admin.findOne({ email }).select('+password');

  if (!admin) {
    console.log("Error: Admin NOT found in database!");
  } else {
    console.log("Admin found!");
    console.log(`Admin ID: ${admin.adminId}`);
    console.log(`Stored password hash: ${admin.password}`);
    
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log(`Comparing with password '${password}': ${isMatch ? "SUCCESS (Matches)" : "FAILED (Does not match)"}`);

    const isMatchAlt = await bcrypt.compare("adminpassword01", admin.password);
    console.log(`Comparing with password 'adminpassword01': ${isMatchAlt ? "SUCCESS" : "FAILED"}`);

    const isMatchAlt2 = await bcrypt.compare("AdminPassword123", admin.password);
    console.log(`Comparing with password 'AdminPassword123': ${isMatchAlt2 ? "SUCCESS" : "FAILED"}`);
  }

  await disconnectDB();
  process.exit(0);
};

test();
