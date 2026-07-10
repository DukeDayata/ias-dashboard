const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const WfpActivity = require('./models/WfpActivity');
    const recent = await WfpActivity.find({}).sort({ _id: -1 }).limit(5);
    console.log(recent.map(r => r._id + ' | ' + r.activity));
    process.exit(0);
  });
