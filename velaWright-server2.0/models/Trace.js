const mongoose = require('mongoose')

const traceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String },
  ideaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Endeavor', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  origin: { type: String, enum: ['trace', 'lead', 'endeavor'], default: null },
  deletedAt: { type: Date, default: null }
}, { timestamps: true })

traceSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 2592000, sparse: true })

module.exports = mongoose.model('Trace', traceSchema)
