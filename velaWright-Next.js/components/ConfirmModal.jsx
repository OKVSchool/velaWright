'use client'

import { useState } from 'react'

export default function ConfirmModal({ message, onDelete, onStash, onCancel }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #dc2626',
          borderRadius: 10,
          padding: '2rem',
          minWidth: 300,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: '#e5e5e5', margin: 0 }}>
            This cannot be undone.
          </p>
          <p style={{ fontSize: '0.875rem', color: '#888', margin: 0 }}>
            Are you sure you want to permanently delete this?
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={onDelete}
              style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: 6, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              Yes, delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{ background: 'none', color: '#e5e5e5', border: '1px solid #444', padding: '0.5rem 1.5rem', borderRadius: 6, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 10,
        padding: '2rem',
        minWidth: 300,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <p style={{ fontSize: '1rem', fontWeight: 600, color: '#e5e5e5', margin: 0 }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={() => setConfirming(true)}
            style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: 6, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            Delete
          </button>
          {onStash && (
            <button
              onClick={onStash}
              style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: 6, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              Stash
            </button>
          )}
          <button
            onClick={onCancel}
            style={{ background: 'none', color: '#e5e5e5', border: '1px solid #444', padding: '0.5rem 1.5rem', borderRadius: 6, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            Keep
          </button>
        </div>
      </div>
    </div>
  )
}
