'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import ConfirmModal from '@/components/ConfirmModal'

function isValidUrl(val) {
  return /^https?:\/\/.+/.test(val.trim())
}

function toDateInput(val) {
  if (!val) return ''
  return new Date(val).toISOString().slice(0, 10)
}

export default function EditDeploymentForm() {
  const { id } = useParams()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState(null)
  const [invalid, setInvalid] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    api.getEndeavor(id)
      .then(e => setForm({
        title:         e.title || '',
        description:   e.description || '',
        framework:     e.framework || '',
        repoUrl:       e.repoUrl || '',
        liveUrl:       e.liveUrl || '',
        demoUrl:       e.demoUrl || '',
        version:       e.version || '',
        platform:      e.platform || '',
        launchDate:    toDateInput(e.launchDate),
        collaborators: e.collaborators?.join(', ') || '',
        tags:          e.tags?.join(', ') || '',
        status:        e.status || 'deployed',
      }))
      .catch(err => setError(err.message))
  }, [user, id])

  const REQUIRED_URLS = ['repoUrl', 'liveUrl']
  const REQUIRED_TEXT = ['title', 'description', 'framework', 'version', 'platform', 'launchDate']

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (!invalid[field]) return
    const met = REQUIRED_URLS.includes(field) ? isValidUrl(value) : value.trim().length > 0
    if (met) setInvalid(prev => { const next = { ...prev }; delete next[field]; return next })
  }

  async function handleSave(e) {
    e.preventDefault()
    const errors = {}
    REQUIRED_TEXT.forEach(f => { if (!form[f].trim()) errors[f] = true })
    REQUIRED_URLS.forEach(f => { if (!isValidUrl(form[f])) errors[f] = true })
    if (Object.keys(errors).length > 0) { setInvalid(errors); return }

    setError('')
    setSubmitting(true)
    try {
      await api.updateEndeavor(id, {
        ...form,
        tags:          form.tags.split(',').map(t => t.trim()).filter(Boolean),
        collaborators: form.collaborators.split(',').map(c => c.trim()).filter(Boolean),
        launchDate:    new Date(form.launchDate).toISOString(),
      })
      router.push('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    try {
      await api.deleteEndeavor(id)
      router.push('/')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleStash() {
    try {
      await api.stashEndeavor(id)
      router.push('/')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading || !form) return <p>Loading…</p>

  const field = (key) => ({
    ...inputStyle,
    border: `1px solid ${invalid[key] ? '#ef4444' : '#2a2a2a'}`,
    transition: 'border-color 0.2s'
  })

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {confirming && (
        <ConfirmModal
          message={`Select ${form.title}'s fate.`}
          onDelete={handleDelete}
          onStash={handleStash}
          onCancel={() => setConfirming(false)}
        />
      )}

      <button
        onClick={() => router.push('/')}
        style={{ background: 'none', border: 'none', color: '#e07820', marginBottom: '1.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
      >
        ← Back
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Edit Deployment</h1>
        <button
          onClick={() => setConfirming(true)}
          style={{ background: 'none', border: '1px solid #7f1d1d', color: '#ef4444', padding: '0.4rem 0.9rem', borderRadius: 6, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
        >
          Delete
        </button>
      </div>

      {error && (
        <p style={{ color: '#f87171', background: '#1a1a1a', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Title *" aria-label="Title" style={field('title')} />
        <textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Description *" aria-label="Description" style={{ ...field('description'), minHeight: 100, resize: 'vertical' }} />
        <input value={form.framework} onChange={e => update('framework', e.target.value)} placeholder="Framework *" aria-label="Framework" style={field('framework')} />
        <input value={form.repoUrl} onChange={e => update('repoUrl', e.target.value)} placeholder="Repo URL *" aria-label="Repository URL" style={field('repoUrl')} />
        <input value={form.liveUrl} onChange={e => update('liveUrl', e.target.value)} placeholder="Live URL *" aria-label="Live URL" style={field('liveUrl')} />
        <input value={form.demoUrl} onChange={e => setForm(f => ({ ...f, demoUrl: e.target.value }))} placeholder="Demo URL" aria-label="Demo URL" style={inputStyle} />
        <input value={form.version} onChange={e => update('version', e.target.value)} placeholder="Version * (e.g. v1.0.0)" aria-label="Version" style={field('version')} />
        <input value={form.platform} onChange={e => update('platform', e.target.value)} placeholder="Platform * (e.g. Vercel, Render, AWS)" aria-label="Platform" style={field('platform')} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.8rem', color: '#888' }}>Launch Date *</label>
          <input type="date" value={form.launchDate} onChange={e => update('launchDate', e.target.value)} aria-label="Launch date" style={{ ...field('launchDate'), colorScheme: 'dark' }} />
        </div>
        <input value={form.collaborators} onChange={e => setForm(f => ({ ...f, collaborators: e.target.value }))} placeholder="Collaborators (comma-separated)" aria-label="Collaborators" style={inputStyle} />
        <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Tags (comma-separated)" aria-label="Tags" style={inputStyle} />
        <button type="submit" disabled={submitting} style={btnStyle}>
          {submitting ? 'Saving…' : 'Save Changes'}
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
