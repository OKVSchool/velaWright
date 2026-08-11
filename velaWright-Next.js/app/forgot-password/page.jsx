'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.forgotPassword({ email })
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 400, margin: '4rem auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Check your inbox</h1>
        <p style={{ color: '#888', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          If <strong style={{ color: '#e5e5e5' }}>{email}</strong> has an account, a reset link is on its way.
          Check your spam folder if it doesn't arrive within a minute.
        </p>
        <Link href="/login" style={{ color: '#e07820', fontSize: '0.875rem' }}>← Back to login</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
        Forgot password?
      </h1>
      <p style={{ color: '#888', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        Enter your email and we'll send you a reset link.
      </p>

      {error && (
        <p style={{ color: '#f87171', background: '#1a1a1a', border: '1px solid #f871711a', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="email"
          placeholder="Email"
          aria-label="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <button type="submit" disabled={submitting} style={btnStyle}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.25rem', color: '#888', fontSize: '0.875rem' }}>
        <Link href="/login" style={{ color: '#e07820' }}>← Back to login</Link>
      </p>
    </div>
  )
}

const inputStyle = {
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  color: '#e5e5e5',
  padding: '0.75rem 1rem',
  borderRadius: 6,
  fontSize: '1rem',
  outline: 'none',
  width: '100%',
}

const btnStyle = {
  background: '#e07820',
  color: '#fff',
  border: 'none',
  padding: '0.75rem',
  borderRadius: 6,
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
}
