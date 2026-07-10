const mongoose = require('mongoose');

const budgetTransactionSchema = new mongoose.Schema({
  obligationNumber: { type: String },
  pap: { type: String, required: true },
  payee: { type: String },
  particulars: { type: String },
  obligationDate: { type: String },
  obligationAmount: { type: Number, default: 0 },
  disbursementDate: { type: String },
  disbursementAmount: { type: Number, default: 0 },
  subAllotmentDate: { type: String },
  subAllotmentAmount: { type: Number, default: 0 },
  type: { type: String, enum: ['CURRENT', 'CONTINUING'], required: true },
  year: { type: String, default: '2026' }
}, { timestamps: true });

module.exports = mongoose.model('BudgetTransaction', budgetTransactionSchema);
