/**
 * validate(schema, { requireAll }) — request body validation middleware
 *
 * schema: { fieldName: { required, minLength, maxLength, isEmail, isUrl, enum } }
 * requireAll: false (default) — used for PUT routes where all fields are optional
 */
module.exports = function validate(schema, { requireAll = true } = {}) {
  return (req, res, next) => {
    const errors = []

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field]
      const present = value !== undefined && value !== null && String(value).trim() !== ''

      if (rules.required && requireAll && !present) {
        errors.push(`${field} is required`)
        continue
      }

      if (!present) continue

      const str = String(value).trim()

      if (rules.minLength && str.length < rules.minLength)
        errors.push(`${field} must be at least ${rules.minLength} characters`)

      if (rules.maxLength && str.length > rules.maxLength)
        errors.push(`${field} must be ${rules.maxLength} characters or fewer`)

      if (rules.isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str))
        errors.push(`${field} must be a valid email address`)

      if (rules.isUrl && !/^https?:\/\/.+/.test(str))
        errors.push(`${field} must be a valid URL (starting with http:// or https://)`)

      if (rules.enum && !rules.enum.includes(value))
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`)
    }

    if (errors.length > 0)
      return res.status(400).json({ error: errors.join(' | ') })

    next()
  }
}
