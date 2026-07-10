const mongoose = require('mongoose');
const { logAction } = require('./utils/logger');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    try {
      const User = require('./models/User');
      const AuditLog = require('./models/AuditLog');
      const adminUser = await User.findOne({ role: 'ADMIN' });
      if (adminUser) {
        await logAction(adminUser, 'CREATE', 'WFP_ACTIVITY', new mongoose.Types.ObjectId(), { test: 'Direct call from endpoint test' });
        console.log('Test log created for user:', adminUser.email);
      } else {
        console.log('No admin user found');
      }
    } catch (e) {
      console.error('Error:', e);
    }
    process.exit(0);
  });
