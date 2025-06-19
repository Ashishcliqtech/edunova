const mongoose = require('mongoose');
const User = require('../src/models/User'); // Adjust path if needed
const config = require('../src/config/config');
const logger = require('../src/utils/logger');

// Seed default admin user
const seedAdmin = async () => {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected.');

    // Validate config values
    if (!config.ADMIN_EMAIL || !config.ADMIN_PASSWORD) {
      throw new Error('ADMIN_EMAIL or ADMIN_PASSWORD is missing in config');
    }

    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      logger.info('Admin user already exists. Skipping creation.');
    } else {
      const admin = new User({
        name: 'Administrator',
        email: config.ADMIN_EMAIL,
        password: config.ADMIN_PASSWORD,
        role: 'admin',
        isActive: true,
        lastLogin: null,
        refreshToken: null,
      });

      await admin.save();
      logger.info('Default admin user created.');
      logger.info(`Admin Email: ${config.ADMIN_EMAIL}`);
    }
  } catch (err) {
    logger.error('Admin seeding failed:', err.message);
    process.exit(1); // Failure
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB.');
    }
    process.exit(0); // Success
  }
};

seedAdmin();
