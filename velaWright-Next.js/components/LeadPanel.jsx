'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import TracePanel from './TracePanel'
import MarkList from './MarkList'
import ConfirmModal from './ConfirmModal'
import Chevron from './Chevron'

const ORIGIN_CHEVRON = { trace: 'basic' }

export default function LeadPanel({ lead, traces, onUpdate, onUpdateTraces, isActive = false }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [traceError, setTraceError] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!isActive) return
    setOpen(true)
    setHighlighted(true)
    const clearHighlight = setTimeout(() => setHighlighted(false), 1800)
    const scroll = setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    return () => { clearTimeout(clearHighlight); clearTimeout(scroll) }
  }, [isActive])

  const [title, setTitle] = useState(lead.title)
  const [priority, setPriority] = useState(lead.priority || 'none')
  const [newTrace, setNewTrace] = useState('')
  const [addingTrace, setAddingTrace] = useState(false)
  const [status, setStatus] = useState(lead.status || 'active')

  async function saveTitle() {
    try {
      await api.updateLead(lead._id, { title })
      setEditing(false)
      setSaveError('')
      onUpdate()
    } catch (err) {
      setTitle(lead.title)
      setSaveError(err.message)
    }
  }

  async function savePriority(val) {
    const prev = priority
    setPriority(val)
    try {
      await api.updateLead(lead._id, { priority: val })
      onUpdate()
    } catch (err) {
      setPriority(prev)
      setSaveError(err.message)
    }
  }

  async function saveStatus(val) {
    const prev = status
    setStatus(val)
    try {
      await api.updateLead(lead._id, { status: val })
      onUpdate()
    } catch (err) {
      setStatus(prev)
      setSaveError(err.message)
    }
  }

  async function deleteLead() {
    await api.deleteLead(lead._id)
    setConfirming(false)
    onUpdate()
  }

  async function stashLead() {
    await api.stashLead(lead._id)
    setConfirming(false)
    onUpdate()
  }

  function promoteToEndeavor() {
    const p = new URLSearchParams({ promoteFrom: 'leads', sourceId: lead._id, title: lead.title, description: lead.description || '', framework: lead.framework || '', lane: lead.lane || '', tags: (lead.tags || []).join(', ') })
    router.push(`/endeavors/new?${p}`)
  }

  async function addTrace(e) {
    e.preventDefault()
    if (!newTrace.trim()) return
    try {
      await api.createTrace({ title: newTrace, ideaId: lead._id })
      setNewTrace('')
      setAddingTrace(false)
      setTraceError('')
      onUpdateTraces()
    } catch (err) {
      setTraceError(err.message)
    }
  }

  const priorityColors = { none: '#555', low: '#22c55e', medium: '#f59e0b', high: '#ef4444' }
  const statusColors = { active: '#22c55e', completed: '#3b82f6', paused: '#f59e0b', promoted: 'var(--accent)' }

  return (
    <div ref={ref} style={{ background: '#1a1a1a', border: `1px solid ${highlighted ? 'var(--accent)' : '#2a2a2a'}`, borderRadius: 8, transition: 'border-color 0.4s' }}>
      {confirming && (
        <ConfirmModal
          message={`Select ${lead.title}'s fate.`}
          onDelete={deleteLead}
          onStash={stashLead}
          onCancel={() => setConfirming(false)}
        />
      )}

      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ color: '#555', fontSize: '0.75rem' }}>{open ? '▼' : '▶'}</span>
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onClick={e => e.stopPropagation()}
            onBlur={saveTitle}
            onKeyDown={e => e.key === 'Enter' && saveTitle()}
            style={{ flex: 1, background: '#0f0f0f', border: '1px solid #444', color: '#e5e5e5', padding: '0.3rem 0.5rem', borderRadius: 4, fontFamily: 'var(--font-body)' }}
          />
        ) : (
          <span style={{ flex: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            {title}
            {lead.origin && <Chevron type={ORIGIN_CHEVRON[lead.origin]} />}
          </span>
        )}
        <select
          value={priority}
          onChange={e => { e.stopPropagation(); savePriority(e.target.value) }}
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
            padding: 0
          }}
        >
          <option value="none">— priority</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <button onClick={e => { e.stopPropagation(); setEditing(true); setSaveError('') }} aria-label="Edit lead" style={iconBtn}>✏️</button>
        <button onClick={e => { e.stopPropagation(); setConfirming(true) }} aria-label="Delete lead" style={{ ...iconBtn, color: '#ef4444' }}>🗑</button>
        <button onClick={e => { e.stopPropagation(); promoteToEndeavor() }} aria-label="Promote to Endeavor" style={{ ...iconBtn, fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>↑ Endeavor</button>
      </div>

      {saveError && (
        <p style={{ color: '#f87171', fontSize: '0.72rem', margin: 0, padding: '0 1rem 0.5rem' }}>{saveError}</p>
      )}

      {open && (
        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', marginTop: '0.75rem' }}>
            {lead.framework && <span style={metaChip}>{lead.framework}</span>}
            {lead.lane && <span style={metaChip}>{lead.lane}</span>}
            {(lead.tags || []).map(tag => <span key={tag} style={tagChip}>{tag}</span>)}
            <select
              value={status}
              onChange={e => saveStatus(e.target.value)}
              style={{ background: 'transparent', border: 'none', fontSize: '0.7rem', fontWeight: 600, color: statusColors[status] || '#22c55e', textTransform: 'uppercase', cursor: 'pointer', outline: 'none', padding: 0 }}
            >
              <option value="active">active</option>
              <option value="completed">completed</option>
              <option value="paused">paused</option>
              <option value="promoted">promoted</option>
            </select>
          </div>
          {lead.description && (
            <p style={{ fontSize: '0.85rem', color: '#888', margin: '0.5rem 0 0', lineHeight: 1.5 }}>{lead.description}</p>
          )}
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {traces.map(t => <TracePanel key={t._id} trace={t} onDelete={onUpdateTraces} nested />)}
          </div>

          {addingTrace ? (
            <>
              <form onSubmit={addTrace} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <input autoFocus value={newTrace} onChange={e => setNewTrace(e.target.value)} placeholder="New trace…" style={{ flex: 1, ...miniInput }} />
                <button type="submit" style={miniBtn}>Add</button>
                <button type="button" onClick={() => { setAddingTrace(false); setTraceError('') }} style={{ ...miniBtn, background: '#2a2a2a' }}>✕</button>
              </form>
              {traceError && <p style={{ color: '#f87171', fontSize: '0.72rem', margin: '0.25rem 0 0' }}>{traceError}</p>}
            </>
          ) : (
            <button onClick={() => setAddingTrace(true)} style={{ ...miniBtn, marginTop: '0.75rem' }}>+ Trace</button>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <MarkList parentId={lead._id} parentType="ideaId" />
          </div>
        </div>
      )}
    </div>
  )
}

const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '0.1rem 0.25rem' }
const miniInput = { background: '#0f0f0f', border: '1px solid #333', color: '#e5e5e5', padding: '0.4rem 0.6rem', borderRadius: 4, fontSize: '0.85rem', fontFamily: 'var(--font-body)' }
const miniBtn = { background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.4rem 0.7rem', borderRadius: 4, fontSize: '0.85rem', cursor: 'pointer' }
const metaChip = { fontSize: '0.72rem', color: '#888', background: '#111', border: '1px solid #2a2a2a', borderRadius: 4, padding: '0.15rem 0.5rem' }
const tagChip = { fontSize: '0.72rem', color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', borderRadius: 4, padding: '0.15rem 0.5rem' }
