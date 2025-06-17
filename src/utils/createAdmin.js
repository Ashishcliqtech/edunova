const User = require('../models/User');
const config = require('../config/config');

const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const admin = new User({
        name: 'System Administrator',
        email: config.ADMIN_EMAIL,
        password: config.ADMIN_PASSWORD,
        role: 'admin'
      });

      await admin.save();
      console.log('Admin user created successfully');
      console.log(`Admin Email: ${config.ADMIN_EMAIL}`);
      console.log(`Admin Password: ${config.ADMIN_PASSWORD}`);
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

module.exports = { createAdminUser };