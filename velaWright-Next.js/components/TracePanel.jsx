'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import ConfirmModal from './ConfirmModal'

export default function TracePanel({ trace, onDelete, nested = false, isActive = false }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [highlighted, setHighlighted] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [title, setTitle] = useState(trace.title)
  const ref = useRef(null)

  useEffect(() => {
    if (!isActive) return
    setHighlighted(true)
    const clearHighlight = setTimeout(() => setHighlighted(false), 1800)
    const scroll = setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    return () => { clearTimeout(clearHighlight); clearTimeout(scroll) }
  }, [isActive])

  async function saveTitle() {
    await api.updateTrace(trace._id, { title })
    setEditing(false)
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

  return (
    <div ref={ref} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      background: nested ? '#0f0f0f' : '#1a1a1a',
      border: `1px solid ${highlighted ? '#e07820' : nested ? '#222' : '#2a2a2a'}`,
      borderRadius: 6,
      padding: '0.6rem 0.9rem',
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

      <span style={{ color: '#555', fontSize: '0.75rem' }}>💭</span>

      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={e => e.key === 'Enter' && saveTitle()}
          style={{ flex: 1, background: '#0f0f0f', border: '1px solid #444', color: '#e5e5e5', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.875rem' }}
        />
      ) : (
        <span style={{ flex: 1, fontSize: '0.9rem', color: '#ddd' }}>{trace.title}</span>
      )}

      <button onClick={() => setEditing(true)} aria-label="Edit trace" style={iconBtn}>✏️</button>
      <button onClick={() => setConfirming(true)} aria-label="Delete trace" style={{ ...iconBtn, color: '#ef4444' }}>🗑</button>
      <button onClick={promoteToLead} aria-label="Promote to Lead" style={{ ...iconBtn, fontSize: '0.7rem', color: '#e07820', fontWeight: 600 }}>↑ Lead</button>
    </div>
  )
}

const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '0.1rem 0.2rem' }
