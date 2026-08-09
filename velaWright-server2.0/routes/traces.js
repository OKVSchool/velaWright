const router = require('express').Router()
const Trace = require('../models/Trace')
const requireAuth = require('../middleware/requireAuth')
const validate = require('../middleware/validate')
const { clientError } = require('../middleware/httpError')

const traceRules = {
  title:    { required: true, minLength: 1, maxLength: 200 },
  category: { maxLength: 50 },
}

router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { deletedAt: null }
      : { userId: req.user._id, deletedAt: null }
    const traces = await Trace.find(filter).sort({ createdAt: -1 })
    res.json(traces)
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/', validate(traceRules), async (req, res) => {
  try {
    const trace = await Trace.create({ ...req.body, userId: req.user._id })
    res.status(201).json(trace)
  } catch (err) {
    res.status(400).json({ error: clientError(err) })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const trace = await Trace.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!trace) return res.status(404).json({ error: 'Trace not found' })
    res.json(trace)
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.put('/:id', validate(traceRules, { requireAll: false }), async (req, res) => {
  try {
    const trace = await Trace.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: null },
      req.body,
      { new: true, runValidators: true }
    )
    if (!trace) return res.status(404).json({ error: 'Trace not found' })
    res.json(trace)
  } catch (err) {
    res.status(400).json({ error: clientError(err) })
  }
})

router.patch('/:id/stash', async (req, res) => {
  try {
    const trace = await Trace.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    )
    if (!trace) return res.status(404).json({ error: 'Trace not found' })
    res.json({ message: 'Trace stashed' })
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const trace = await Trace.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!trace) return res.status(404).json({ error: 'Trace not found' })
    res.json({ message: 'Trace deleted' })
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

module.exports = router
