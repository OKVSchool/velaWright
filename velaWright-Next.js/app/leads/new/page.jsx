'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

function AddLeadFormInner() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const promoteFrom = params.get('promoteFrom')
  const sourceId    = params.get('sourceId')
  const isPromotion = !!(promoteFrom && sourceId)

  const [form, setForm] = useState({
    title:       params.get('title') || '',
    description: params.get('description') || '',
    priority:    'none',
  })
  const [invalid, setInvalid]   = useState({})
  const [error, setError]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (invalid[field] && value.trim().length > 0)
      setInvalid(prev => { const next = { ...prev }; delete next[field]; return next })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setInvalid({ title: true }); return }

    setError('')
    setSubmitting(true)
    try {
      if (isPromotion) {
        await api.promote({
          fromCollection: promoteFrom,
          fromId:         sourceId,
          toCollection:   'leads',
          title:          form.title,
          description:    form.description,
          priority:       form.priority,
        })
      } else {
        await api.createLead({ title: form.title, description: form.description, priority: form.priority })
      }
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
        style={{ background: 'none', border: 'none', color: '#e07820', marginBottom: '1.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
      >
        ← Back
      </button>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        {isPromotion ? 'Promote to Lead' : 'New Lead'}
      </h1>

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
          aria-label="Lead title"
          style={{ ...inputStyle, border: `1px solid ${invalid.title ? '#ef4444' : '#2a2a2a'}` }}
        />
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Description"
          aria-label="Lead description"
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
        />
        <select
          value={form.priority}
          onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
          aria-label="Priority"
          style={inputStyle}
        >
          <option value="none">No priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit" disabled={submitting} style={btnStyle}>
          {submitting ? 'Saving…' : isPromotion ? 'Promote to Lead' : 'Create Lead'}
        </button>
      </form>
    </div>
  )
}

export default function AddLeadForm() {
  return (
    <Suspense>
      <AddLeadFormInner />
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
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
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
