'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import TracePanel from './TracePanel'
import MarkList from './MarkList'
import ConfirmModal from './ConfirmModal'

export default function EndeavorPanel({ endeavor, traces, onUpdate, onUpdateTraces, isActive = false }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDetails, setEditingDetails] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [title, setTitle] = useState(endeavor.title)
  const [addingTrace, setAddingTrace] = useState(false)
  const [newTrace, setNewTrace] = useState('')
  const [details, setDetails] = useState({
    description: endeavor.description || '',
    framework: endeavor.framework || '',
    repoUrl: endeavor.repoUrl || '',
    status: endeavor.status || 'active',
    tags: endeavor.tags?.join(', ') || '',
  })
  const ref = useRef(null)

  useEffect(() => {
    if (!isActive) return
    setOpen(true)
    setHighlighted(true)
    const clearHighlight = setTimeout(() => setHighlighted(false), 1800)
    const scroll = setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    return () => { clearTimeout(clearHighlight); clearTimeout(scroll) }
  }, [isActive])

  async function saveTitle() {
    await api.updateEndeavor(endeavor._id, { title })
    setEditingTitle(false)
    onUpdate?.()
  }

  async function saveDetails() {
    await api.updateEndeavor(endeavor._id, {
      description: details.description,
      framework: details.framework,
      repoUrl: details.repoUrl,
      status: details.status,
      tags: details.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    setEditingDetails(false)
    onUpdate?.()
  }

  async function deleteEndeavor() {
    await api.deleteEndeavor(endeavor._id)
    setConfirming(false)
    onUpdate?.()
  }

  async function stashEndeavor() {
    await api.stashEndeavor(endeavor._id)
    setConfirming(false)
    onUpdate?.()
  }

  function promoteToDeployment() {
    const p = new URLSearchParams({
      promoteFrom:  'endeavors',
      sourceId:     endeavor._id,
      title:        endeavor.title,
      description:  endeavor.description || '',
      framework:    endeavor.framework || '',
      repoUrl:      endeavor.repoUrl || '',
      tags:         endeavor.tags?.join(', ') || '',
    })
    router.push(`/deployments/new?${p}`)
  }

  async function addTrace(e) {
    e.preventDefault()
    if (!newTrace.trim()) return
    await api.createTrace({ title: newTrace, projectId: endeavor._id })
    setNewTrace('')
    setAddingTrace(false)
    onUpdateTraces?.()
  }

  const statusColors = { active: '#22c55e', paused: '#f59e0b', completed: '#3b82f6', deployed: '#a78bfa' }

  return (
    <div ref={ref} style={{ background: '#1a1a1a', border: `1px solid ${highlighted ? '#e07820' : '#2a2a2a'}`, borderRadius: 8, transition: 'border-color 0.4s' }}>
      {confirming && (
        <ConfirmModal
          message={`Select ${endeavor.title}'s fate.`}
          onDelete={deleteEndeavor}
          onStash={stashEndeavor}
          onCancel={() => setConfirming(false)}
        />
      )}

      {/* Header row */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ color: '#555', fontSize: '0.75rem' }}>{open ? '▼' : '▶'}</span>

        {editingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onClick={e => e.stopPropagation()}
            onBlur={saveTitle}
            onKeyDown={e => e.key === 'Enter' && saveTitle()}
            style={{ flex: 1, background: '#0f0f0f', border: '1px solid #444', color: '#e5e5e5', padding: '0.3rem 0.5rem', borderRadius: 4 }}
          />
        ) : (
          <span style={{ flex: 1, fontWeight: 500 }}>{endeavor.title}</span>
        )}

        {endeavor.status && (
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: statusColors[endeavor.status] || '#555', textTransform: 'uppercase' }}>
            {endeavor.status}
          </span>
        )}
        {endeavor.framework && (
          <span style={{ fontSize: '0.7rem', color: '#666', background: '#2a2a2a', padding: '0.15rem 0.4rem', borderRadius: 4 }}>
            {endeavor.framework}
          </span>
        )}

        <button onClick={e => { e.stopPropagation(); setEditingTitle(true) }} aria-label="Edit title" style={iconBtn}>✏️</button>
        <button onClick={e => { e.stopPropagation(); setConfirming(true) }} aria-label="Delete endeavor" style={{ ...iconBtn, color: '#ef4444' }}>🗑</button>
        <button onClick={e => { e.stopPropagation(); promoteToDeployment() }} aria-label="Promote to Deployment" style={{ ...iconBtn, fontSize: '0.7rem', color: '#e07820', fontWeight: 600 }}>↑ Deploy</button>
      </div>

      {/* Expanded body */}
      {open && (
        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #2a2a2a' }}>

          {/* Details section */}
          {editingDetails ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
              <textarea
                value={details.description}
                onChange={e => setDetails(d => ({ ...d, description: e.target.value }))}
                placeholder="Description"
                style={{ ...fieldInput, minHeight: 72, resize: 'vertical' }}
              />
              <input value={details.framework} onChange={e => setDetails(d => ({ ...d, framework: e.target.value }))} placeholder="Framework" style={fieldInput} />
              <input value={details.repoUrl} onChange={e => setDetails(d => ({ ...d, repoUrl: e.target.value }))} placeholder="Repo URL" style={fieldInput} />
              <input value={details.tags} onChange={e => setDetails(d => ({ ...d, tags: e.target.value }))} placeholder="Tags (comma-separated)" style={fieldInput} />
              <select value={details.status} onChange={e => setDetails(d => ({ ...d, status: e.target.value }))} style={fieldInput}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="deployed">Deployed</option>
              </select>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={saveDetails} style={miniBtn}>Save</button>
                <button onClick={() => setEditingDetails(false)} style={{ ...miniBtn, background: '#2a2a2a' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              {endeavor.description && (
                <p style={{ color: '#aaa', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 0.75rem' }}>{endeavor.description}</p>
              )}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>
                {endeavor.repoUrl && (
                  <a href={endeavor.repoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#e07820', textDecoration: 'none' }}>
                    Repo ↗
                  </a>
                )}
              </div>
              {endeavor.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {endeavor.tags.map(tag => (
                    <span key={tag} style={{ fontSize: '0.7rem', background: '#e0782022', color: '#e07820', padding: '0.15rem 0.4rem', borderRadius: 4 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <button onClick={() => setEditingDetails(true)} style={{ ...miniBtn, background: 'none', border: '1px solid #333', color: '#888', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                Edit details
              </button>
            </div>
          )}

          {/* Traces */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {traces.length === 0
              ? <p style={{ color: '#555', fontSize: '0.875rem' }}>Uncharted Waters</p>
              : traces.map(t => <TracePanel key={t._id} trace={t} onDelete={onUpdateTraces} nested />)
            }
          </div>

          {addingTrace ? (
            <form onSubmit={addTrace} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <input autoFocus value={newTrace} onChange={e => setNewTrace(e.target.value)} placeholder="New trace…" style={{ flex: 1, ...fieldInput }} />
              <button type="submit" style={miniBtn}>Add</button>
              <button type="button" onClick={() => setAddingTrace(false)} style={{ ...miniBtn, background: '#2a2a2a' }}>✕</button>
            </form>
          ) : (
            <button onClick={() => setAddingTrace(true)} style={{ ...miniBtn, marginTop: '0.75rem' }}>+ Trace</button>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <MarkList parentId={endeavor._id} parentType="projectId" />
          </div>
        </div>
      )}
    </div>
  )
}

const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '0.1rem 0.25rem', color: '#e5e5e5' }
const fieldInput = { background: '#0f0f0f', border: '1px solid #333', color: '#e5e5e5', padding: '0.4rem 0.6rem', borderRadius: 4, fontSize: '0.875rem', width: '100%', outline: 'none', boxSizing: 'border-box' }
const miniBtn = { background: '#e07820', color: '#fff', border: 'none', padding: '0.4rem 0.7rem', borderRadius: 4, fontSize: '0.85rem', cursor: 'pointer' }
