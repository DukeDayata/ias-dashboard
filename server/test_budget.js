const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const BudgetTransaction = require('./models/BudgetTransaction');
    const recent = await BudgetTransaction.find({}).limit(1);
    console.log(JSON.stringify(recent, null, 2));
    process.exit(0);
  });
