const router = require('express').Router()
const multer = require('multer')
const path = require('path')
const Endeavor = require('../models/Endeavor')
const requireAuth = require('../middleware/requireAuth')
const validate = require('../middleware/validate')
const { clientError } = require('../middleware/httpError')

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'))
    }
  }
})

const endeavorRules = {
  title:       { required: true, minLength: 1, maxLength: 100 },
  description: { required: true, maxLength: 1000 },
  framework:   { required: true, maxLength: 50 },
  repoUrl:     { required: true, isUrl: true },
  status:      { enum: ['active', 'completed', 'paused', 'deployed'] },
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

router.post('/:id/image', (req, res, next) => {
  upload.single('image')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message })
    next()
  })
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' })
    const imageUrl = `/uploads/${req.file.filename}`
    const endeavor = await Endeavor.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: null },
      { imageUrl },
      { new: true }
    )
    if (!endeavor) return res.status(404).json({ error: 'Endeavor not found' })
    res.json(endeavor)
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

module.exports = router
