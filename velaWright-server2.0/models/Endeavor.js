const mongoose = require('mongoose')

const endeavorSchema = new mongoose.Schema({
  title:         { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  status:        { type: String, enum: ['active', 'completed', 'paused', 'deployed'], default: 'active' },
  framework:     { type: String },
  lane:          { type: String, default: '' },
  repoUrl:       { type: String },
  liveUrl:       { type: String },
  demoUrl:       { type: String },
  version:       { type: String },
  platform:      { type: String },
  launchDate:    { type: Date, default: null },
  collaborators: [{ type: String }],
  tags:          [{ type: String }],
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  priority:      { type: String, enum: ['none', 'low', 'medium', 'high'], default: 'none' },
  origin:        { type: String, enum: ['trace', 'lead', 'endeavor'], default: null },
  deletedAt:     { type: Date, default: null }
}, { timestamps: true })

endeavorSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 2592000, sparse: true })

module.exports = mongoose.model('Endeavor', endeavorSchema)
