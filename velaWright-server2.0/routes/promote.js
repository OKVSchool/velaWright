const router = require('express').Router()
const Trace = require('../models/Trace')
const Lead = require('../models/Lead')
const Endeavor = require('../models/Endeavor')
const requireAuth = require('../middleware/requireAuth')

const MODELS = { traces: Trace, leads: Lead, endeavors: Endeavor }
const SINGULAR = { traces: 'trace', leads: 'lead', endeavors: 'endeavor' }

router.use(requireAuth)

router.post('/', async (req, res) => {
  const { fromCollection, fromId, toCollection, ...data } = req.body

  const FromModel = MODELS[fromCollection]
  const ToModel = MODELS[toCollection]

  if (!FromModel || !ToModel) {
    return res.status(400).json({ error: 'Invalid collection' })
  }

  try {
    const source = await FromModel.findOne({ _id: fromId, userId: req.user._id, deletedAt: null })
    if (!source) return res.status(404).json({ error: 'Source item not found' })

    const origin = source.origin || SINGULAR[fromCollection]

    const newItem = await ToModel.create({ ...data, userId: req.user._id, origin })

    await FromModel.findOneAndDelete({ _id: fromId, userId: req.user._id })

    res.status(201).json(newItem)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
