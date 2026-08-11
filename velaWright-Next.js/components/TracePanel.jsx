'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import ConfirmModal from './ConfirmModal'

export default function TracePanel({ trace, onDelete, nested = false, isActive = false }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [highlighted, setHighlighted] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [title, setTitle] = useState(trace.title)
  const [priority, setPriority] = useState(trace.priority || 'none')
  const [saveError, setSaveError] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!isActive) return
    setHighlighted(true)
    const clearHighlight = setTimeout(() => setHighlighted(false), 1800)
    const scroll = setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    return () => { clearTimeout(clearHighlight); clearTimeout(scroll) }
  }, [isActive])

  async function savePriority(val) {
    const prev = priority
    setPriority(val)
    try {
      await api.updateTrace(trace._id, { priority: val })
    } catch (err) {
      setPriority(prev)
      setSaveError(err.message)
    }
  }

  async function saveTitle() {
    try {
      await api.updateTrace(trace._id, { title })
      setEditing(false)
      setSaveError('')
      onDelete()
    } catch (err) {
      setTitle(trace.title)
      setSaveError(err.message)
    }
  }

  async function deleteTrace() {
    await api.deleteTrace(trace._id)
    setConfirming(false)
    onDelete()
  }

  async function stashTrace() {
    await api.stashTrace(trace._id)
    setConfirming(false)
    onDelete()
  }

  function promoteToLead() {
    const p = new URLSearchParams({ promoteFrom: 'traces', sourceId: trace._id, title: trace.title, description: trace.description || '' })
    router.push(`/leads/new?${p}`)
  }

  const hasDetails = !!(trace.description || trace.lane || (trace.tags || []).length > 0)

  return (
    <div ref={ref} style={{
      background: nested ? '#0f0f0f' : '#1a1a1a',
      border: `1px solid ${highlighted ? 'var(--accent)' : nested ? '#222' : '#2a2a2a'}`,
      borderRadius: 6,
      transition: 'border-color 0.4s'
    }}>
      {confirming && (
        <ConfirmModal
          message={`Select ${trace.title}'s fate.`}
          onDelete={deleteTrace}
          onStash={stashTrace}
          onCancel={() => setConfirming(false)}
        />
      )}

      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.9rem', cursor: hasDetails ? 'pointer' : 'default' }}
        onClick={() => hasDetails && setOpen(o => !o)}
      >
        {hasDetails
          ? <span style={{ color: '#555', fontSize: '0.65rem' }}>{open ? '▼' : '▶'}</span>
          : <span style={{ color: '#555', fontSize: '0.65rem', visibility: 'hidden' }}>▶</span>
        }
        <span style={{ color: '#555', fontSize: '0.75rem' }}>💭</span>

        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onClick={e => e.stopPropagation()}
            onBlur={saveTitle}
            onKeyDown={e => e.key === 'Enter' && saveTitle()}
            style={{ flex: 1, background: '#0f0f0f', border: '1px solid #444', color: '#e5e5e5', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}
          />
        ) : (
          <span style={{ flex: 1, fontSize: '0.9rem', color: '#ddd' }}>{title}</span>
        )}

        <select
          value={priority}
          onChange={e => savePriority(e.target.value)}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: priorityColors[priority] || '#555',
            textTransform: 'uppercase',
            cursor: 'pointer',
            outline: 'none',
            padding: 0,
          }}
        >
          <option value="none">— priority</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <button onClick={e => { e.stopPropagation(); setEditing(true); setSaveError('') }} aria-label="Edit trace" style={iconBtn}>✏️</button>
        <button onClick={e => { e.stopPropagation(); setConfirming(true) }} aria-label="Delete trace" style={{ ...iconBtn, color: '#ef4444' }}>🗑</button>
        <button onClick={e => { e.stopPropagation(); promoteToLead() }} aria-label="Promote to Lead" style={{ ...iconBtn, fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>↑ Lead</button>
      </div>

      {saveError && <p style={{ color: '#f87171', fontSize: '0.72rem', margin: 0, padding: '0 0.9rem 0.5rem' }}>{saveError}</p>}

      {open && hasDetails && (
        <div style={{ padding: '0.5rem 0.9rem 0.75rem', borderTop: `1px solid ${nested ? '#1a1a1a' : '#2a2a2a'}` }}>
          {trace.description && (
            <p style={{ fontSize: '0.85rem', color: '#888', margin: '0 0 0.5rem', lineHeight: 1.5 }}>{trace.description}</p>
          )}
          {(trace.lane || (trace.tags || []).length > 0) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {trace.lane && <span style={metaChip}>{trace.lane}</span>}
              {(trace.tags || []).map(tag => <span key={tag} style={tagChip}>{tag}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const priorityColors = { none: '#555', low: '#22c55e', medium: '#f59e0b', high: '#ef4444' }
const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '0.1rem 0.2rem' }
const metaChip = { fontSize: '0.72rem', color: '#888', background: '#111', border: '1px solid #2a2a2a', borderRadius: 4, padding: '0.15rem 0.5rem' }
const tagChip = { fontSize: '0.72rem', color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', borderRadius: 4, padding: '0.15rem 0.5rem' }
