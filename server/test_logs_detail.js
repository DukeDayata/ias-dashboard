const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const AuditLog = require('./models/AuditLog');
    const logs = await AuditLog.find({});
    console.log(JSON.stringify(logs, null, 2));
    process.exit(0);
  });
