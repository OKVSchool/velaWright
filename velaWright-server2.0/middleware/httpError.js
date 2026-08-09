function clientError(err) {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'value'
    return `${field} is already in use`
  }
  if (err.name === 'ValidationError') {
    return Object.values(err.errors).map(e => e.message).join(' | ')
  }
  return 'Invalid request'
}

module.exports = { clientError }
