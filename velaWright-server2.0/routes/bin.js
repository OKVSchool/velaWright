const router = require('express').Router()
const Endeavor = require('../models/Endeavor')
const Lead = require('../models/Lead')
const Trace = require('../models/Trace')
const Mark = require('../models/Mark')
const requireAuth = require('../middleware/requireAuth')

const MODELS = { endeavors: Endeavor, leads: Lead, traces: Trace, marks: Mark }

router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const uid = req.user._id
    const filter = { userId: uid, deletedAt: { $ne: null } }

    const [endeavors, leads, traces, marks] = await Promise.all([
      Endeavor.find(filter).sort({ deletedAt: -1 }),
      Lead.find(filter).sort({ deletedAt: -1 }),
      Trace.find(filter).sort({ deletedAt: -1 }),
      Mark.find(filter).sort({ deletedAt: -1 }),
    ])

    const tag = (type, items) => items.map(i => ({ ...i.toObject(), _type: type }))

    const all = [
      ...tag('endeavors', endeavors),
      ...tag('leads', leads),
      ...tag('traces', traces),
      ...tag('marks', marks),
    ].sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt))

    res.json(all)
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/:collection/:id/restore', async (req, res) => {
  try {
    const Model = MODELS[req.params.collection]
    if (!Model) return res.status(400).json({ error: 'Invalid collection' })

    const item = await Model.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: { $ne: null } },
      { $set: { deletedAt: null } },
      { new: true }
    )
    if (!item) return res.status(404).json({ error: 'Item not found' })
    res.json(item)
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/:collection/:id/resurface', async (req, res) => {
  try {
    const Model = MODELS[req.params.collection]
    if (!Model) return res.status(400).json({ error: 'Invalid collection' })

    const item = await Model.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: { $ne: null } },
      { $set: { deletedAt: new Date() } },
      { new: true }
    )
    if (!item) return res.status(404).json({ error: 'Item not found' })
    res.json(item)
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.delete('/:collection/:id', async (req, res) => {
  try {
    const Model = MODELS[req.params.collection]
    if (!Model) return res.status(400).json({ error: 'Invalid collection' })

    const item = await Model.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!item) return res.status(404).json({ error: 'Item not found' })
    res.json({ message: 'Permanently deleted' })
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

module.exports = router
