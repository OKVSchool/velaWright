'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(form)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
        Log in to velaWright
      </h1>

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
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          aria-label="Password"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          required
          style={inputStyle}
        />
        <button type="submit" disabled={submitting} style={btnStyle}>
          {submitting ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.25rem', color: '#888', fontSize: '0.875rem' }}>
        No account? <Link href="/signup" style={{ color: '#e07820' }}>Sign up</Link>
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
  width: '100%'
}

const btnStyle = {
  background: '#e07820',
  color: '#fff',
  border: 'none',
  padding: '0.75rem',
  borderRadius: 6,
  fontSize: '1rem',
  fontWeight: 600
}
