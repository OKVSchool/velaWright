const mongoose = require('mongoose')

const markSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  notes: { type: String, default: '' },
  dueBy: { type: Date, default: null },
  done: { type: Boolean, default: false },
  category: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Endeavor', default: null },
  ideaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
  deletedAt: { type: Date, default: null }
}, { timestamps: true })

markSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 2592000, sparse: true })

module.exports = mongoose.model('Mark', markSchema)
