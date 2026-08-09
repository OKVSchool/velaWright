const router = require('express').Router()
const Mark = require('../models/Mark')
const requireAuth = require('../middleware/requireAuth')
const validate = require('../middleware/validate')
const { clientError } = require('../middleware/httpError')

const markRules = {
  title: { required: true, minLength: 1, maxLength: 200 },
  notes: { maxLength: 500 },
}

router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const { projectId, ideaId } = req.query
    const filter = { userId: req.user._id, deletedAt: null }
    if (projectId) filter.projectId = projectId
    if (ideaId) filter.ideaId = ideaId
    const marks = await Mark.find(filter).sort({ createdAt: -1 })
    res.json(marks)
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/', validate(markRules), async (req, res) => {
  try {
    const mark = await Mark.create({ ...req.body, userId: req.user._id })
    res.status(201).json(mark)
  } catch (err) {
    res.status(400).json({ error: clientError(err) })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const mark = await Mark.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!mark) return res.status(404).json({ error: 'Mark not found' })
    res.json(mark)
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.put('/:id', validate(markRules, { requireAll: false }), async (req, res) => {
  try {
    const mark = await Mark.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: null },
      req.body,
      { new: true, runValidators: true }
    )
    if (!mark) return res.status(404).json({ error: 'Mark not found' })
    res.json(mark)
  } catch (err) {
    res.status(400).json({ error: clientError(err) })
  }
})

router.patch('/:id/stash', async (req, res) => {
  try {
    const mark = await Mark.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    )
    if (!mark) return res.status(404).json({ error: 'Mark not found' })
    res.json({ message: 'Mark stashed' })
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const mark = await Mark.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!mark) return res.status(404).json({ error: 'Mark not found' })
    res.json({ message: 'Mark deleted' })
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

module.exports = router
