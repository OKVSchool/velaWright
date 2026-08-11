const router = require('express').Router()
const Endeavor = require('../models/Endeavor')
const requireAuth = require('../middleware/requireAuth')
const validate = require('../middleware/validate')
const { clientError } = require('../middleware/httpError')

const endeavorRules = {
  title:       { required: true, minLength: 1, maxLength: 100 },
  description: { required: true, maxLength: 1000 },
  framework:   { required: true, maxLength: 50 },
  repoUrl:     { required: true, isUrl: true },
  status:      { enum: ['active', 'completed', 'paused', 'deployed'] },
  priority:    { enum: ['none', 'low', 'medium', 'high'] },
  liveUrl:     { isUrl: true },
  demoUrl:     { isUrl: true },
  version:     { maxLength: 30 },
  platform:    { maxLength: 50 },
}

router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { deletedAt: null }
      : { userId: req.user._id, deletedAt: null }
    const endeavors = await Endeavor.find(filter).sort({ createdAt: -1 })
    res.json(endeavors)
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/', validate(endeavorRules), async (req, res) => {
  try {
    const endeavor = await Endeavor.create({ ...req.body, userId: req.user._id })
    res.status(201).json(endeavor)
  } catch (err) {
    res.status(400).json({ error: clientError(err) })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id, deletedAt: null }
      : { _id: req.params.id, userId: req.user._id, deletedAt: null }
    const endeavor = await Endeavor.findOne(filter)
    if (!endeavor) return res.status(404).json({ error: 'Endeavor not found' })
    res.json(endeavor)
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.put('/:id', validate(endeavorRules, { requireAll: false }), async (req, res) => {
  try {
    const endeavor = await Endeavor.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: null },
      req.body,
      { new: true, runValidators: true }
    )
    if (!endeavor) return res.status(404).json({ error: 'Endeavor not found' })
    res.json(endeavor)
  } catch (err) {
    res.status(400).json({ error: clientError(err) })
  }
})

router.patch('/:id/stash', async (req, res) => {
  try {
    const endeavor = await Endeavor.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    )
    if (!endeavor) return res.status(404).json({ error: 'Endeavor not found' })
    res.json({ message: 'Endeavor stashed' })
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const endeavor = await Endeavor.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!endeavor) return res.status(404).json({ error: 'Endeavor not found' })
    res.json({ message: 'Endeavor deleted' })
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

module.exports = router
