const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'BULK_UPLOAD']
  },
  collectionName: {
    type: String,
    required: true
  },
  documentId: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: 'timestamp', updatedAt: false }
});

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ collectionName: 1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
