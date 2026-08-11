'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

function ResetPasswordInner() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) setError('Missing reset token. Please use the link from your email.')
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await api.resetPassword(token, { newPassword: form.newPassword })
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={{ maxWidth: 400, margin: '4rem auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Password reset</h1>
        <p style={{ color: '#888', marginBottom: '1.5rem' }}>
          Your password has been updated. Redirecting you to login…
        </p>
        <Link href="/login" style={{ color: '#e07820', fontSize: '0.875rem' }}>Go to login</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
        Set a new password
      </h1>
      <p style={{ color: '#888', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        Must be at least 8 characters.
      </p>

      {error && (
        <p style={{ color: '#f87171', background: '#1a1a1a', border: '1px solid #f871711a', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="password"
          placeholder="New password"
          aria-label="New password"
          value={form.newPassword}
          onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
          required
          minLength={8}
          disabled={!token}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          aria-label="Confirm new password"
          value={form.confirmPassword}
          onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
          required
          minLength={8}
          disabled={!token}
          style={inputStyle}
        />
        <button type="submit" disabled={submitting || !token} style={btnStyle}>
          {submitting ? 'Saving…' : 'Reset password'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.25rem', color: '#888', fontSize: '0.875rem' }}>
        <Link href="/login" style={{ color: '#e07820' }}>← Back to login</Link>
      </p>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
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
