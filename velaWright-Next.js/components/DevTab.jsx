'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('vw_token')
}

const LIVE_TESTS = [

  // ── BASIC ──────────────────────────────────────────────────────────────────
  { isSection: true, title: 'Basic' },
  {
    label: 'Loading — GET /endeavors (live)',
    description: 'Fires the real getEndeavors call. Watch the button enter loading state before the response arrives.',
    run: async () => {
      const data = await api.getEndeavors()
      return { status: 200, data }
    }
  },
  {
    label: 'Full CRUD lifecycle — endeavor',
    description: 'Creates a test endeavor, reads it back, updates it, then deletes it. All four operations must succeed and clean up after themselves.',
    run: async () => {
      const created = await api.createEndeavor({ title: '__dev_crud_test__', description: 'Created by Dev tab' })
      const read    = await api.getEndeavor(created._id)
      const updated = await api.updateEndeavor(created._id, { title: '__dev_crud_test__ — updated' })
      const deleted = await api.deleteEndeavor(created._id)
      return {
        status: 200,
        data: {
          '1 create (201)': { id: created._id, title: created.title },
          '2 read   (200)': { title: read.title, idMatch: read._id === created._id },
          '3 update (200)': { title: updated.title },
          '4 delete (200)': deleted,
        }
      }
    }
  },

  // ── AUTH ───────────────────────────────────────────────────────────────────
  { isSection: true, title: 'Auth' },
  {
    label: 'DELETE /marks/[id] with no Authorization header',
    description: 'Sends a DELETE with no Authorization header at all. requireAuth checks for the Bearer prefix before jwt.verify() is ever called — the mark should not be deleted.',
    run: async () => {
      const res = await fetch(`${BASE_URL}/marks/64a1f2000000000000000000`, {
        method: 'DELETE'
      })
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: 'No Authorization header — GET /endeavors',
    description: 'Same missing-header check on a different route and method, confirming requireAuth is applied consistently across routes.',
    run: async () => {
      const res = await fetch(`${BASE_URL}/endeavors`)
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: '401 — Completely fake token',
    description: 'Sends a fabricated string as the Bearer token. requireAuth calls jwt.verify() which rejects it immediately.',
    run: async () => {
      const res = await fetch(`${BASE_URL}/endeavors`, {
        headers: { Authorization: 'Bearer this-is-not-a-valid-token' }
      })
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: 'Tampered token (real JWT, flipped signature)',
    description: 'Takes your real JWT and flips one character in the signature segment. The header and payload are untouched — only the signature is wrong.',
    run: async () => {
      const token = getToken()
      if (!token) return { status: 'ERR', data: { error: 'Not logged in — no token in localStorage' } }
      const parts = token.split('.')
      const sig = parts[2]
      const tamperedSig = sig.slice(0, -1) + (sig.slice(-1) === 'a' ? 'b' : 'a')
      const tampered = [parts[0], parts[1], tamperedSig].join('.')
      const res = await fetch(`${BASE_URL}/endeavors`, {
        headers: { Authorization: `Bearer ${tampered}` }
      })
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: 'Login — wrong password',
    description: 'Sends a POST /auth/login with a valid email format but the wrong password. Should return 401 without revealing whether the email exists.',
    run: async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'definitelywrong99' })
      })
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: 'Signup — duplicate email',
    description: 'Attempts to create an account with an email that is already registered. Should return 400 via the clientError() 11000 handler — not a raw MongoDB error.',
    run: async () => {
      const res = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Dup User', email: 'duplicate@test.com', password: 'password123' })
      })
      const first = await res.json()
      const res2 = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Dup User', email: 'duplicate@test.com', password: 'password123' })
      })
      const second = await res2.json()
      return {
        status: res2.status,
        data: { firstAttempt: first.token ? 'account created' : first.error, secondAttempt: second }
      }
    }
  },

  // ── VALIDATION ─────────────────────────────────────────────────────────────
  { isSection: true, title: 'Validation' },
  {
    label: '400 — POST /endeavors with no title (required field missing)',
    description: 'Sends an empty body. The validate middleware should reject it before any database write occurs.',
    run: async () => {
      const res = await fetch(`${BASE_URL}/endeavors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({})
      })
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: '400 — Invalid enum value',
    description: 'Sends status: "flying" — not in the allowed enum [active, completed, paused, deployed]. Validate middleware should catch it.',
    run: async () => {
      const res = await fetch(`${BASE_URL}/endeavors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ title: 'Enum test', status: 'flying' })
      })
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: '400 — Invalid URL format',
    description: 'Sends repoUrl: "not-a-url" — fails the isUrl rule (must start with http:// or https://).',
    run: async () => {
      const res = await fetch(`${BASE_URL}/endeavors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ title: 'URL test', repoUrl: 'not-a-url' })
      })
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: 'Oversized title + script tag in description',
    description: 'Sends a title 150 chars long (max is 100) and a <script> tag in description. Both should be caught by validate middleware.',
    run: async () => {
      const res = await fetch(`${BASE_URL}/endeavors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ title: 'A'.repeat(150), description: '<script>alert(1)</script>' })
      })
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: '200 — PUT with empty body (partial update allowed)',
    description: 'Sends a PUT with no fields. requireAll: false means nothing is required on updates — this should pass and return the unchanged document.',
    run: async () => {
      const endeavors = await api.getEndeavors()
      if (!endeavors.length) return { status: 'SKIP', data: { note: 'No endeavors to update — create one first' } }
      const res = await fetch(`${BASE_URL}/endeavors/${endeavors[0]._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({})
      })
      return { status: res.status, data: await res.json() }
    }
  },

  // ── OWNERSHIP ──────────────────────────────────────────────────────────────
  { isSection: true, title: 'Ownership' },
  {
    label: '404 — GET /endeavors/[nonexistent id]',
    description: 'Requests a valid-format ObjectId that does not exist. The ownership-scoped query finds nothing and returns 404.',
    run: async () => {
      const res = await fetch(`${BASE_URL}/endeavors/000000000000000000000000`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: "DELETE another user's endeavor",
    description: "Sends a DELETE for a valid ObjectId that belongs to a different user. Returns 404 — not 403 — because the { _id, userId } ownership filter makes it indistinguishable from a missing record. This is intentional: a 403 would confirm the ID exists, leaking information to an attacker.",
    run: async () => {
      const res = await fetch(`${BASE_URL}/endeavors/507f1f77bcf86cd799439011`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return { status: res.status, data: await res.json() }
    }
  },

  // ── UPLOADS ────────────────────────────────────────────────────────────────
  { isSection: true, title: 'Uploads' },
  {
    label: 'Oversized file (6 MB, limit is 5 MB)',
    description: 'Constructs a 6 MB Blob and posts it as an image. Multer should reject it before writing anything to disk.',
    run: async () => {
      const bigBlob = new Blob([new Uint8Array(6 * 1024 * 1024)], { type: 'image/jpeg' })
      const form = new FormData()
      form.append('image', bigBlob, 'oversized.jpg')
      const res = await fetch(`${BASE_URL}/endeavors/507f1f77bcf86cd799439011/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form
      })
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: 'Disallowed file type (.txt uploaded as image)',
    description: 'Sends a text file with type text/plain. The multer fileFilter checks mimetype against the allowlist [jpeg, png, webp, gif] and should reject it.',
    run: async () => {
      const txtBlob = new Blob(['not an image'], { type: 'text/plain' })
      const form = new FormData()
      form.append('image', txtBlob, 'exploit.txt')
      const res = await fetch(`${BASE_URL}/endeavors/507f1f77bcf86cd799439011/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form
      })
      return { status: res.status, data: await res.json() }
    }
  },

  // ── SECURITY ───────────────────────────────────────────────────────────────
  { isSection: true, title: 'Security' },
  {
    label: 'NoSQL injection — {"$gt":""} as email on login',
    description: 'Classic MongoDB injection: sends an operator object as the email field hoping to match any user. The isEmail validator converts it to "[object Object]" which fails the regex — stopped before it reaches the database.',
    run: async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: { $gt: '' }, password: 'anything' })
      })
      return { status: res.status, data: await res.json() }
    }
  },
]

export default function DevTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {LIVE_TESTS.map((item, i) =>
        item.isSection
          ? <SectionHeader key={i} title={item.title} />
          : <LiveTest key={item.label} test={item} />
      )}
    </div>
  )
}

function SectionHeader({ title }) {
  return (
    <h3 style={{
      fontSize: '0.7rem',
      fontWeight: 700,
      color: '#555',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      marginTop: '1rem',
      marginBottom: '0.25rem',
      paddingBottom: '0.4rem',
      borderBottom: '1px solid #1e1e1e'
    }}>
      {title}
    </h3>
  )
}

function LiveTest({ test }) {
  const [state, setState] = useState({ phase: 'idle', status: null, data: null })

  async function run() {
    setState({ phase: 'loading', status: null, data: null })
    try {
      const result = await test.run()
      setState({ phase: 'done', status: result.status, data: result.data })
    } catch (err) {
      setState({ phase: 'done', status: 'ERR', data: { error: err.message } })
    }
  }

  const statusColor = state.phase === 'loading'
    ? '#f59e0b'
    : state.status >= 200 && state.status < 300
      ? '#22c55e'
      : '#ef4444'

  return (
    <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: state.phase !== 'idle' ? '0.75rem' : 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{test.label}</div>
          <div style={{ fontSize: '0.78rem', color: '#666' }}>{test.description}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
          {state.phase !== 'idle' && (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: statusColor }}>
              {state.phase === 'loading' ? 'loading…' : `${state.status}`}
            </span>
          )}
          <button
            onClick={run}
            disabled={state.phase === 'loading'}
            style={{
              background: state.phase === 'loading' ? '#2a2a2a' : '#e07820',
              color: '#fff',
              border: 'none',
              padding: '0.4rem 0.9rem',
              borderRadius: 4,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: state.phase === 'loading' ? 'not-allowed' : 'pointer'
            }}
          >
            Run
          </button>
          {state.phase === 'done' && (
            <button
              onClick={() => setState({ phase: 'idle', status: null, data: null })}
              style={{ background: 'none', border: '1px solid #333', color: '#666', padding: '0.4rem 0.6rem', borderRadius: 4, fontSize: '0.8rem', cursor: 'pointer', lineHeight: 1 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {state.phase === 'done' && (
        <pre style={{
          background: '#0a0a0a',
          border: `1px solid ${statusColor}33`,
          borderRadius: 6,
          padding: '0.75rem',
          fontSize: '0.78rem',
          color: '#ccc',
          overflowX: 'auto',
          margin: 0
        }}>
          {JSON.stringify(state.data, null, 2)}
        </pre>
      )}
    </div>
  )
}
