const { Resend } = require('resend')

const APP = process.env.CLIENT_URL || 'http://localhost:3000'
const FROM = 'velaWright <onboarding@resend.dev>'

function getClient() {
  return new Resend(process.env.RESEND_API_KEY)
}

function sendVerificationEmail(to, token) {
  const link = `${APP}/verify-email?token=${token}`
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Verify email for ${to}: ${link}`)
    return Promise.resolve()
  }
  return getClient().emails.send({
    from: FROM,
    to,
    subject: 'Verify your velaWright email',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
        <h2 style="color:#e07820">velaWright</h2>
        <p>Thanks for signing up. Click the button below to verify your email address.</p>
        <a href="${link}" style="display:inline-block;background:#e07820;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">
          Verify Email
        </a>
        <p style="color:#888;font-size:0.875rem">Or copy this link:<br>${link}</p>
        <p style="color:#888;font-size:0.875rem">This link does not expire.</p>
      </div>
    `,
  })
}

function sendPasswordResetEmail(to, token) {
  const link = `${APP}/reset-password?token=${token}`
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Password reset for ${to}: ${link}`)
    return Promise.resolve()
  }
  return getClient().emails.send({
    from: FROM,
    to,
    subject: 'Reset your velaWright password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
        <h2 style="color:#e07820">velaWright</h2>
        <p>Someone requested a password reset for this account. Click below to set a new password.</p>
        <a href="${link}" style="display:inline-block;background:#e07820;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">
          Reset Password
        </a>
        <p style="color:#888;font-size:0.875rem">Or copy this link:<br>${link}</p>
        <p style="color:#888;font-size:0.875rem">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  })
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail }
