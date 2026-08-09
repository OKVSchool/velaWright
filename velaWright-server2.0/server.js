const mongoose = require('mongoose')
const app = require('./app')

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')
    const PORT = process.env.PORT || 3001
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch(err => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })
