const mongoose = require('mongoose');

const budgetSummarySchema = new mongoose.Schema({
  program: { type: String },
  pap: { type: String, required: true },
  type: { type: String, enum: ['CURRENT', 'CONTINUING'], required: true },
  allotment: {
    central: { type: Number, default: 0 },
    regional: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  year: { type: String, default: '2026' }
}, { timestamps: true });

module.exports = mongoose.model('BudgetSummary', budgetSummarySchema);
