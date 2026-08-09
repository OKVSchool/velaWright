require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes = require('./routes/auth')
const endeavorRoutes = require('./routes/endeavors')
const leadRoutes = require('./routes/leads')
const traceRoutes = require('./routes/traces')
const markRoutes = require('./routes/marks')
const adminRoutes = require('./routes/admin')
const binRoutes = require('./routes/bin')
const promoteRoutes = require('./routes/promote')

const app = express()

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use(cors({
  origin: (process.env.CLIENT_URL || 'http://localhost:3000').trim(),
  credentials: true
}))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/auth', authRoutes)
app.use('/endeavors', endeavorRoutes)
app.use('/leads', leadRoutes)
app.use('/traces', traceRoutes)
app.use('/marks', markRoutes)
app.use('/admin', adminRoutes)
app.use('/bin', binRoutes)
app.use('/promote', promoteRoutes)

module.exports = app
