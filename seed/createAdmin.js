const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');

dotenv.config();

const ADMIN_EMAIL = 'admin@serviceconnect.com';
const ADMIN_PASSWORD = 'admin123';

const run = async () => {
  await connectDB();

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log('Admin account already exists:', ADMIN_EMAIL);
    process.exit();
  }

  await User.create({
    name: 'Admin',
    email: ADMIN_EMAIL,
    phone: '9999999999',
    password: ADMIN_PASSWORD,
    role: 'admin'
  });

  console.log('Admin account created!');
  console.log('Email:   ', ADMIN_EMAIL);
  console.log('Password:', ADMIN_PASSWORD);
  console.log('(Change this password later — this is only for local MVP testing.)');
  process.exit();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
