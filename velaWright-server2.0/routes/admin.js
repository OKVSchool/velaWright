const router = require('express').Router()
const User = require('../models/User')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')

router.use(requireAuth)
router.use(requireRole('admin'))

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

module.exports = router
