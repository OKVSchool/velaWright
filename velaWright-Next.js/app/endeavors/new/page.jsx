'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

function isValidUrl(val) {
  return /^https?:\/\/.+/.test(val.trim())
}

function AddEndeavorFormInner() {
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
    title:       params.get('title')       || '',
    description: params.get('description') || '',
    framework:   params.get('framework')   || '',
    lane:        params.get('lane')        || '',
    repoUrl:     '',
    tags:        params.get('tags')        || '',
    status:      'active',
  })
  const [invalid, setInvalid] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (!invalid[field]) return
    const met = field === 'repoUrl' ? isValidUrl(value) : value.trim().length > 0
    if (met) setInvalid(prev => { const next = { ...prev }; delete next[field]; return next })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = {}
    if (!form.title.trim())        errors.title = true
    if (!form.description.trim())  errors.description = true
    if (!form.framework.trim())    errors.framework = true
    if (!isValidUrl(form.repoUrl)) errors.repoUrl = true
    if (Object.keys(errors).length > 0) { setInvalid(errors); return }

    setError('')
    setSubmitting(true)
    try {
      const payload = {
        title:       form.title,
        description: form.description,
        framework:   form.framework,
        lane:        form.lane,
        repoUrl:     form.repoUrl,
        tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
        status:      form.status,
      }
      if (isPromotion) {
        await api.promote({ fromCollection: promoteFrom, fromId: sourceId, toCollection: 'endeavors', ...payload })
      } else {
        await api.createEndeavor(payload)
      }
      router.push('/leads')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !user) return null

  const field = (key) => ({
    ...inputStyle,
    border: `1px solid ${invalid[key] ? '#ef4444' : '#2a2a2a'}`,
    transition: 'border-color 0.2s'
  })

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <button
        onClick={() => router.push('/leads')}
        style={{ background: 'none', border: 'none', color: 'var(--accent)', marginBottom: '1.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
      >
        ← Back
      </button>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        {isPromotion ? 'Promote to Endeavor' : 'New Endeavor'}
      </h1>

      {error && (
        <p style={{ color: '#f87171', background: '#1a1a1a', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Title *" aria-label="Endeavor title" style={field('title')} />
        <textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Description *" aria-label="Endeavor description" style={{ ...field('description'), minHeight: 100, resize: 'vertical' }} />
        <input value={form.framework} onChange={e => update('framework', e.target.value)} placeholder="Framework *" aria-label="Framework" style={field('framework')} />
        <input value={form.lane} onChange={e => setForm(f => ({ ...f, lane: e.target.value }))} placeholder="Lane (e.g. Frontend, Backend)" aria-label="Lane" style={inputStyle} />
        <input value={form.repoUrl} onChange={e => update('repoUrl', e.target.value)} placeholder="Repo URL *" aria-label="Repository URL" style={field('repoUrl')} />
        <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Tags (comma-separated)" aria-label="Tags" style={inputStyle} />
        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} aria-label="Endeavor status" style={inputStyle}>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
        </select>
        <button type="submit" disabled={submitting} style={btnStyle}>
          {submitting ? 'Saving…' : isPromotion ? 'Promote to Endeavor' : 'Create Endeavor'}
        </button>
      </form>
    </div>
  )
}

export default function AddEndeavorForm() {
  return (
    <Suspense>
      <AddEndeavorFormInner />
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
