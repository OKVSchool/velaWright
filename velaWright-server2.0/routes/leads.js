const router = require('express').Router()
const Lead = require('../models/Lead')
const requireAuth = require('../middleware/requireAuth')
const validate = require('../middleware/validate')
const { clientError } = require('../middleware/httpError')

const leadRules = {
  title:       { required: true, minLength: 1, maxLength: 100 },
  description: { maxLength: 500 },
  category:    { maxLength: 50 },
  status:      { enum: ['active', 'parked', 'promoted'] },
  priority:    { enum: ['none', 'low', 'medium', 'high'] },
}

router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { deletedAt: null }
      : { userId: req.user._id, deletedAt: null }
    const leads = await Lead.find(filter).sort({ createdAt: -1 })
    res.json(leads)
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/', validate(leadRules), async (req, res) => {
  try {
    const lead = await Lead.create({ ...req.body, userId: req.user._id })
    res.status(201).json(lead)
  } catch (err) {
    res.status(400).json({ error: clientError(err) })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    res.json(lead)
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.put('/:id', validate(leadRules, { requireAll: false }), async (req, res) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: null },
      req.body,
      { new: true, runValidators: true }
    )
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    res.json(lead)
  } catch (err) {
    res.status(400).json({ error: clientError(err) })
  }
})

router.patch('/:id/stash', async (req, res) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    )
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    res.json({ message: 'Lead stashed' })
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    res.json({ message: 'Lead deleted' })
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

module.exports = router
