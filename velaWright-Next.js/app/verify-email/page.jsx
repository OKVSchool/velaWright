'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

function VerifyEmailInner() {
  const params = useSearchParams()
  const token = params.get('token')
  const { user, updateUser } = useAuth()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found. Please use the link from your email.')
      return
    }
    api.verifyEmail(token)
      .then(() => {
        if (user) updateUser({ emailVerified: true })
        setStatus('success')
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.message)
      })
  }, [token])

  if (status === 'loading') {
    return (
      <div style={{ maxWidth: 400, margin: '4rem auto', textAlign: 'center' }}>
        <p style={{ color: '#888' }}>Verifying…</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div style={{ maxWidth: 400, margin: '4rem auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Email verified</h1>
        <p style={{ color: '#888', marginBottom: '1.5rem' }}>
          Your email address has been confirmed. You're all set.
        </p>
        <Link href="/" style={btnStyle}>Go to velaWright</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Verification failed</h1>
      <p style={{ color: '#f87171', marginBottom: '1.5rem' }}>{message}</p>
      <p style={{ color: '#888', fontSize: '0.875rem' }}>
        Already logged in?{' '}
        <Link href="/settings" style={{ color: '#e07820' }}>Resend from settings</Link>
      </p>
    </div>
  )
}

export default function VerifyEmail() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  )
}

const btnStyle = {
  display: 'inline-block',
  background: '#e07820',
  color: '#fff',
  padding: '0.75rem 1.5rem',
  borderRadius: 6,
  fontWeight: 600,
  textDecoration: 'none',
  fontSize: '1rem',
}
