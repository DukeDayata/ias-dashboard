const mongoose = require('mongoose');
const { logAction } = require('./utils/logger');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    try {
      console.log('Testing logAction...');
      // Mock user
      const user = { _id: new mongoose.Types.ObjectId(), name: 'TestUser', email: 'test@example.com' };
      await logAction(user, 'CREATE', 'WFP_ACTIVITY', new mongoose.Types.ObjectId(), { activityTitle: 'Test Activity' });
      console.log('logAction completed.');
    } catch (e) {
      console.error('Error:', e);
    }
    process.exit(0);
  });
