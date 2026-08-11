const router = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const validate = require('../middleware/validate')
const requireAuth = require('../middleware/requireAuth')
const { clientError } = require('../middleware/httpError')

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
})

const signupRules = {
  name:     { required: true, minLength: 2, maxLength: 50 },
  email:    { required: true, isEmail: true },
  password: { required: true, minLength: 8, maxLength: 128 },
}

const loginRules = {
  email:    { required: true, isEmail: true },
  password: { required: true },
}

const updateProfileRules = {
  name:  { minLength: 2, maxLength: 50 },
  email: { isEmail: true },
}

const changePasswordRules = {
  currentPassword: { required: true },
  newPassword:     { required: true, minLength: 8, maxLength: 128 },
}

// ── Public routes ────────────────────────────────────────────

router.post('/signup', validate(signupRules), async (req, res) => {
  try {
    const { email, password, name } = req.body
    const user = await User.create({ email, password, name })
    res.status(201).json({ token: signToken(user._id), user: userPayload(user) })
  } catch (err) {
    res.status(400).json({ error: clientError(err) })
  }
})

router.post('/login', validate(loginRules), async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    res.json({ token: signToken(user._id), user: userPayload(user) })
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// ── Auth-required routes ─────────────────────────────────────

router.patch('/me', requireAuth, validate(updateProfileRules, { requireAll: false }), async (req, res) => {
  try {
    const { name, email } = req.body
    const update = {}
    if (name  && name.trim())  update.name  = name.trim()
    if (email && email.trim()) update.email = email.toLowerCase().trim()

    const user = await User.findByIdAndUpdate(
      req.user._id,
      update,
      { new: true, runValidators: true }
    ).select('-password')

    res.json({ user: userPayload(user) })
  } catch (err) {
    res.status(400).json({ error: clientError(err) })
  }
})

router.patch('/me/password', requireAuth, validate(changePasswordRules), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }
    user.password = newPassword
    await user.save()
    res.json({ message: 'Password updated' })
  } catch (err) {
    res.status(400).json({ error: clientError(err) })
  }
})

module.exports = router
