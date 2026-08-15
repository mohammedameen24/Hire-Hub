/**
 * Quick script to list all user accounts in the DB.
 * Run with: node listUsers.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hirehub';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB\n');

  const users = await mongoose.connection.db
    .collection('users')
    .find({}, { projection: { password: 0, loginAttempts: 0, lockUntil: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  if (users.length === 0) {
    console.log('No users found. Run: npm run seed');
  } else {
    console.log(`Found ${users.length} user(s):\n`);
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.full_name}`);
      console.log(`   Email  : ${u.email}`);
      console.log(`   Role   : ${u.role}`);
      console.log(`   Active : ${u.is_active}`);
      console.log(`   Verified: ${u.is_verified}`);
      console.log(`   Created: ${u.createdAt?.toISOString().split('T')[0] || 'N/A'}`);
      console.log('');
    });
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
