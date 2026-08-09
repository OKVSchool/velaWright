const router = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const validate = require('../middleware/validate')
const { clientError } = require('../middleware/httpError')

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
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

module.exports = router
