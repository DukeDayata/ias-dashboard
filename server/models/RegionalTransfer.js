const mongoose = require('mongoose');

const regionalTransferSchema = new mongoose.Schema({
  id: { type: String },
  year: { type: String, default: '2026' },
  pap: { type: String },
  saaNumber: { type: String },
  obligation: { type: Number, default: 0 },
  disbursement: { type: Number, default: 0 },
  date: { type: String },
  transferTo: { type: String },
  transferFrom: { type: Number, default: 0 },
  status: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('RegionalTransfer', regionalTransferSchema);
