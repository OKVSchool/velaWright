'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

function isValidUrl(val) {
  return /^https?:\/\/.+/.test(val.trim())
}

function AddDeploymentFormInner() {
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
    title:         params.get('title') || '',
    description:   params.get('description') || '',
    framework:     params.get('framework') || '',
    repoUrl:       params.get('repoUrl') || '',
    liveUrl:       '',
    version:       '',
    platform:      '',
    launchDate:    '',
    demoUrl:       '',
    collaborators: params.get('collaborators') || '',
    tags:          params.get('tags') || '',
    status:        'deployed',
  })
  const [invalid, setInvalid] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const REQUIRED_URLS = ['repoUrl', 'liveUrl']
  const REQUIRED_TEXT = ['title', 'description', 'framework', 'version', 'platform', 'launchDate']

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (!invalid[field]) return
    const met = REQUIRED_URLS.includes(field) ? isValidUrl(value) : value.trim().length > 0
    if (met) setInvalid(prev => { const next = { ...prev }; delete next[field]; return next })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = {}
    REQUIRED_TEXT.forEach(f => { if (!form[f].trim()) errors[f] = true })
    REQUIRED_URLS.forEach(f => { if (!isValidUrl(form[f])) errors[f] = true })
    if (Object.keys(errors).length > 0) { setInvalid(errors); return }

    setError('')
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        tags:          form.tags.split(',').map(t => t.trim()).filter(Boolean),
        collaborators: form.collaborators.split(',').map(c => c.trim()).filter(Boolean),
        launchDate:    new Date(form.launchDate).toISOString(),
      }
      if (isPromotion) {
        await api.promote({ fromCollection: promoteFrom, fromId: sourceId, toCollection: 'endeavors', ...payload })
      } else {
        await api.createEndeavor(payload)
      }
      router.push('/')
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
        onClick={() => router.push('/')}
        style={{ background: 'none', border: 'none', color: 'var(--accent)', marginBottom: '1.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
      >
        ← Back
      </button>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        {isPromotion ? 'Promote to Deployment' : 'New Deployment'}
      </h1>

      {error && (
        <p style={{ color: '#f87171', background: '#1a1a1a', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Title *" aria-label="Title" style={field('title')} />
        <textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Description *" aria-label="Description" style={{ ...field('description'), minHeight: 100, resize: 'vertical' }} />
        <input value={form.framework} onChange={e => update('framework', e.target.value)} placeholder="Framework *" aria-label="Framework" style={field('framework')} />
        <input value={form.repoUrl} onChange={e => update('repoUrl', e.target.value)} placeholder="Repo URL *" aria-label="Repository URL" style={field('repoUrl')} />
        <input value={form.liveUrl} onChange={e => update('liveUrl', e.target.value)} placeholder="Live URL *" aria-label="Live URL" style={field('liveUrl')} />
        <input value={form.version} onChange={e => update('version', e.target.value)} placeholder="Version * (e.g. v1.0.0)" aria-label="Version" style={field('version')} />
        <input value={form.platform} onChange={e => update('platform', e.target.value)} placeholder="Platform * (e.g. Vercel, Render, AWS)" aria-label="Platform" style={field('platform')} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.8rem', color: '#888' }}>Launch Date *</label>
          <input type="date" value={form.launchDate} onChange={e => update('launchDate', e.target.value)} aria-label="Launch date" style={{ ...field('launchDate'), colorScheme: 'dark' }} />
        </div>
        <input value={form.demoUrl} onChange={e => setForm(f => ({ ...f, demoUrl: e.target.value }))} placeholder="Demo URL" aria-label="Demo URL" style={inputStyle} />
        <input value={form.collaborators} onChange={e => setForm(f => ({ ...f, collaborators: e.target.value }))} placeholder="Collaborators (comma-separated)" aria-label="Collaborators" style={inputStyle} />
        <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Tags (comma-separated)" aria-label="Tags" style={inputStyle} />
        <button type="submit" disabled={submitting} style={btnStyle}>
          {submitting ? 'Saving…' : isPromotion ? 'Promote to Deployment' : 'Create Deployment'}
        </button>
      </form>
    </div>
  )
}

export default function AddDeploymentForm() {
  return (
    <Suspense>
      <AddDeploymentFormInner />
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
