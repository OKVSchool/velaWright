const crypto = require('crypto')
const router = require('express').Router()
const rateLimit = require('express-rate-limit')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const validate = require('../middleware/validate')
const requireAuth = require('../middleware/requireAuth')
const { clientError } = require('../middleware/httpError')
const { sendVerificationEmail, sendPasswordResetEmail } = require('../lib/mailer')

const emailLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many requests — please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  emailVerified: user.emailVerified,
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

const resetPasswordRules = {
  newPassword: { required: true, minLength: 8, maxLength: 128 },
}

// ── Public routes ────────────────────────────────────────────

router.post('/signup', emailLimit, validate(signupRules), async (req, res) => {
  try {
    const { email, password, name } = req.body
    const emailVerifyToken = crypto.randomBytes(32).toString('hex')
    const user = await User.create({ email, password, name, emailVerifyToken })
    sendVerificationEmail(email, emailVerifyToken).catch(err =>
      console.error('Verification email failed:', err.message)
    )
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

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ error: 'Token is required' })
    const user = await User.findOne({ emailVerifyToken: token })
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification link' })
    user.emailVerified = true
    user.emailVerifyToken = null
    await user.save()
    res.json({ message: 'Email verified' })
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/forgot-password', emailLimit, async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })
    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      user.passwordResetToken = token
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000)
      await user.save()
      sendPasswordResetEmail(user.email, token).catch(err =>
        console.error('Reset email failed:', err.message)
      )
    }
    // Always same response — don't reveal whether the email exists
    res.json({ message: "If that email is in our system, you'll receive a reset link shortly." })
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/reset-password/:token', validate(resetPasswordRules), async (req, res) => {
  try {
    const user = await User.findOne({
      passwordResetToken: req.params.token,
      passwordResetExpires: { $gt: new Date() },
    })
    if (!user) return res.status(400).json({ error: 'Reset link is invalid or has expired' })
    user.password = req.body.newPassword
    user.passwordResetToken = null
    user.passwordResetExpires = null
    await user.save()
    res.json({ message: 'Password has been reset. You can now log in.' })
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// ── Auth-required routes ─────────────────────────────────────

router.post('/resend-verification', emailLimit, requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (user.emailVerified) return res.json({ message: 'Email already verified' })
    const token = crypto.randomBytes(32).toString('hex')
    user.emailVerifyToken = token
    await user.save()
    await sendVerificationEmail(user.email, token)
    res.json({ message: 'Verification email sent' })
  } catch (err) {
    console.error('[resend-verification]', err.message)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

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
