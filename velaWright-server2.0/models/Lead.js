const mongoose = require('mongoose')

const leadSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  framework:   { type: String, default: '' },
  lane:        { type: String, default: '' },
  tags:        { type: [String], default: [] },
  status:      { type: String, enum: ['active', 'completed', 'paused', 'promoted'], default: 'active' },
  priority:    { type: String, enum: ['none', 'low', 'medium', 'high'], default: 'none' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  origin: { type: String, enum: ['trace', 'lead', 'endeavor'], default: null },
  deletedAt: { type: Date, default: null }
}, { timestamps: true })

leadSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 2592000, sparse: true })

module.exports = mongoose.model('Lead', leadSchema)
