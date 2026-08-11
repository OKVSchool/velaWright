'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

export default function Nav() {
  const { user, logout } = useAuth()

  return (
    <>
      <nav className="nav-root">
        <Link href="/" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e07820' }}>
          velaWright
        </Link>
        <div className="nav-links">
          {user ? (
            <>
              <Link href="/">Deployments</Link>
              <Link href="/leads">Ventures</Link>
              <Link href="/settings">Settings</Link>
              <Link href="/dev">Dev</Link>
              <span style={{ color: '#888', fontSize: '0.875rem' }}>{user.name}</span>
              <button
                onClick={logout}
                style={{ background: 'none', border: '1px solid #444', color: '#e5e5e5', padding: '0.25rem 0.75rem', borderRadius: 4 }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/signup">Sign Up</Link>
            </>
          )}
        </div>
      </nav>
      {user && !user.emailVerified && <VerificationBanner />}
    </>
  )
}

function VerificationBanner() {
  const { updateUser } = useAuth()
  const [status, setStatus] = useState('idle')

  async function resend() {
    setStatus('sending')
    try {
      await api.resendVerification()
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div style={{
      background: '#1a1208',
      borderBottom: '1px solid #78450a',
      padding: '0.5rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      fontSize: '0.8rem',
      color: '#e07820',
    }}>
      <span>Please verify your email address.</span>
      {status === 'idle' && (
        <button
          onClick={resend}
          style={{ background: 'none', border: '1px solid #78450a', color: '#e07820', padding: '0.2rem 0.6rem', borderRadius: 4, fontSize: '0.8rem', cursor: 'pointer' }}
        >
          Resend email
        </button>
      )}
      {status === 'sending' && <span style={{ color: '#888' }}>Sending…</span>}
      {status === 'sent'    && <span style={{ color: '#22c55e' }}>Check your inbox.</span>}
      {status === 'error'   && <span style={{ color: '#f87171' }}>Failed to send — try again later.</span>}
    </div>
  )
}
