'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Nav() {
  const { user, logout } = useAuth()

  return (
    <nav className="nav-root">
      <Link href="/" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-brand)' }}>
        velaWright
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link href="/"        style={{ fontFamily: 'var(--font-tab)', fontWeight: 900 }}>Deployments</Link>
            <Link href="/leads"   style={{ fontFamily: 'var(--font-tab)', fontWeight: 900 }}>Ventures</Link>
            <Link href="/settings"style={{ fontFamily: 'var(--font-tab)', fontWeight: 900 }}>Settings</Link>
            <Link href="/dev"     style={{ fontFamily: 'var(--font-tab)', fontWeight: 900 }}>Dev</Link>
            <span style={{ color: '#888', fontSize: '0.875rem' }}>{user.name}</span>
            <button
              onClick={logout}
              style={{ background: 'none', border: '1px solid #444', color: '#e5e5e5', padding: '0.25rem 0.75rem', borderRadius: 4, fontFamily: 'var(--font-body)' }}
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
  )
}
