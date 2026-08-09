'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import ConfirmModal from './ConfirmModal'

export default function MarkList({ parentId, parentType }) {
  const [marks, setMarks] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    api.getMarks({ [parentType]: parentId }).then(setMarks)
  }, [parentId, parentType])

  async function addMark(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    try {
      const mark = await api.createMark({ title: newTitle, [parentType]: parentId })
      setMarks(prev => [mark, ...prev])
      setNewTitle('')
      setAdding(false)
    } catch { /* ignore */ }
  }

  async function toggleDone(mark) {
    const updated = await api.updateMark(mark._id, { done: !mark.done })
    setMarks(prev => prev.map(m => m._id === updated._id ? updated : m))
  }

  async function deleteMark() {
    await api.deleteMark(confirmId)
    setMarks(prev => prev.filter(m => m._id !== confirmId))
    setConfirmId(null)
  }

  async function stashMark() {
    await api.stashMark(confirmId)
    setMarks(prev => prev.filter(m => m._id !== confirmId))
    setConfirmId(null)
  }

  const confirmingMark = marks.find(m => m._id === confirmId)

  return (
    <div>
      {confirmingMark && (
        <ConfirmModal
          message={`Select ${confirmingMark.title}'s fate.`}
          onDelete={deleteMark}
          onStash={stashMark}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Marks</h2>
        <button
          onClick={() => setAdding(a => !a)}
          style={{ background: 'none', border: '1px solid #444', color: '#e5e5e5', padding: '0.25rem 0.6rem', borderRadius: 4, fontSize: '0.875rem' }}
        >
          + Add mark
        </button>
      </div>

      {adding && (
        <form onSubmit={addMark} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Mark title"
            style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#e5e5e5', padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.875rem' }}
          />
          <button type="submit" style={{ background: '#e07820', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 6, fontWeight: 600 }}>
            Add
          </button>
        </form>
      )}

      {marks.length === 0 ? (
        <p style={{ color: '#555', fontSize: '0.875rem' }}>No Marks</p>
      ) : (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {marks.map(mark => (
            <li key={mark._id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              padding: '0.6rem 0.9rem',
              borderRadius: 6
            }}>
              <input
                type="checkbox"
                checked={mark.done}
                onChange={() => toggleDone(mark)}
                style={{ accentColor: '#e07820', width: 16, height: 16 }}
              />
              <span style={{ flex: 1, textDecoration: mark.done ? 'line-through' : 'none', color: mark.done ? '#555' : '#e5e5e5', fontSize: '0.9rem' }}>
                {mark.title}
              </span>
              <button onClick={() => setConfirmId(mark._id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1rem', cursor: 'pointer' }}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
