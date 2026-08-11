'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

export default function AddTraceForm() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const [form, setForm] = useState({
    title:       '',
    description: '',
    lane:        '',
    tags:        '',
  })
  const [titleError, setTitleError] = useState(false)
  const [error, setError]           = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (field === 'title' && value.trim().length > 0) setTitleError(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setTitleError(true); return }

    setError('')
    setSubmitting(true)
    try {
      await api.createTrace({
        title:       form.title,
        description: form.description,
        lane:        form.lane,
        tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      router.push('/leads')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !user) return null

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <button
        onClick={() => router.push('/leads')}
        style={{ background: 'none', border: 'none', color: 'var(--accent)', marginBottom: '1.5rem', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
      >
        ← Back
      </button>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>New Trace</h1>

      {error && (
        <p style={{ color: '#f87171', background: '#1a1a1a', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          value={form.title}
          onChange={e => update('title', e.target.value)}
          placeholder="Title *"
          aria-label="Trace title"
          style={{ ...inputStyle, border: `1px solid ${titleError ? '#ef4444' : '#2a2a2a'}`, transition: 'border-color 0.2s' }}
        />
        <textarea
          value={form.description}
          onChange={e => update('description', e.target.value)}
          placeholder="Description"
          aria-label="Trace description"
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
        />
        <input
          value={form.lane}
          onChange={e => update('lane', e.target.value)}
          placeholder="Lane"
          aria-label="Lane"
          style={inputStyle}
        />
        <input
          value={form.tags}
          onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
          placeholder="Tags (comma-separated)"
          aria-label="Tags"
          style={inputStyle}
        />
        <button type="submit" disabled={submitting} style={btnStyle}>
          {submitting ? 'Saving…' : 'Create Trace'}
        </button>
      </form>
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
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-body)',
}

const btnStyle = {
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  padding: '0.75rem',
  borderRadius: 6,
  fontSize: '1rem',
  fontWeight: 600,
  fontFamily: 'var(--font-body)',
  cursor: 'pointer',
}
