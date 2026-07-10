const mongoose = require('mongoose');

const wfpActivitySchema = new mongoose.Schema({
  month: { type: String, required: true },
  projectProgram: { type: String, required: true },
  activity: { type: String, required: true },
  objectOfExpenditure: { type: String, required: true },
  participants: { type: Number, default: 0 },
  unitCost: { type: Number, default: 0 },
  totalBudget: { type: Number, default: 0 },
  remarks: { type: String, default: '' },
  year: { type: String, default: '2026' }
}, { timestamps: true });

module.exports = mongoose.model('WfpActivity', wfpActivitySchema);
