'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import ConfirmModal from '@/components/ConfirmModal'

const TYPE_LABEL = { endeavors: 'Endeavor', leads: 'Lead', traces: 'Trace', marks: 'Mark' }
const TYPE_COLOR = { endeavors: '#3b82f6', leads: '#e07820', traces: '#a78bfa', marks: '#22c55e' }
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function daysLeft(deletedAt) {
  const expires = new Date(deletedAt).getTime() + THIRTY_DAYS_MS
  return Math.max(0, Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000)))
}

export default function Settings() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [section, setSection] = useState('stash')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading || !user) return <p>Loading…</p>

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 80px)' }}>

      {/* Sidebar */}
      <nav style={{
        width: 200,
        flexShrink: 0,
        borderRight: '1px solid #2a2a2a',
        paddingTop: '0.5rem',
        paddingRight: '1rem',
      }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', paddingLeft: '0.75rem' }}>
          Settings
        </p>
        {['stash', 'account'].map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              background: section === s ? '#2a2a2a' : 'none',
              border: 'none',
              color: section === s ? '#e5e5e5' : '#888',
              padding: '0.5rem 0.75rem',
              borderRadius: 6,
              fontSize: '0.9rem',
              fontWeight: section === s ? 600 : 400,
              cursor: 'pointer',
              marginBottom: '0.15rem',
              textTransform: 'capitalize',
            }}
          >
            {s}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div style={{ flex: 1, paddingLeft: '2rem', paddingTop: '0.5rem', maxWidth: 640 }}>
        {section === 'stash'   && <StashSection />}
        {section === 'account' && <AccountSection />}
      </div>

    </div>
  )
}

function AccountSection() {
  const { user, updateUser } = useAuth()

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  async function saveProfile(e) {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setProfileSaving(true)
    try {
      const { user: updated } = await api.updateProfile({
        name: profile.name,
        email: profile.email,
      })
      updateUser(updated)
      setProfileSuccess('Profile updated')
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setProfileSaving(false)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    setPasswordSaving(true)
    try {
      await api.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordSuccess('Password updated')
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Account</h2>
      <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '2rem' }}>
        Update your name, email, or password.
      </p>

      {/* Profile */}
      <div style={card}>
        <h3 style={subhead}>Profile</h3>
        {profileError   && <p style={errorStyle}>{profileError}</p>}
        {profileSuccess && <p style={successStyle}>{profileSuccess}</p>}
        <form onSubmit={saveProfile} style={formCol}>
          <label style={labelStyle}>Name</label>
          <input
            value={profile.name}
            onChange={e => { setProfile(p => ({ ...p, name: e.target.value })); setProfileSuccess('') }}
            required
            minLength={2}
            style={inputStyle}
          />
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={profile.email}
            onChange={e => { setProfile(p => ({ ...p, email: e.target.value })); setProfileSuccess('') }}
            required
            style={inputStyle}
          />
          <button type="submit" disabled={profileSaving} style={btnStyle}>
            {profileSaving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div style={{ ...card, marginTop: '1.5rem' }}>
        <h3 style={subhead}>Change Password</h3>
        {passwordError   && <p style={errorStyle}>{passwordError}</p>}
        {passwordSuccess && <p style={successStyle}>{passwordSuccess}</p>}
        <form onSubmit={savePassword} style={formCol}>
          <label style={labelStyle}>Current Password</label>
          <input
            type="password"
            value={passwords.currentPassword}
            onChange={e => { setPasswords(p => ({ ...p, currentPassword: e.target.value })); setPasswordSuccess('') }}
            required
            style={inputStyle}
          />
          <label style={labelStyle}>New Password</label>
          <input
            type="password"
            value={passwords.newPassword}
            onChange={e => { setPasswords(p => ({ ...p, newPassword: e.target.value })); setPasswordSuccess('') }}
            required
            minLength={8}
            style={inputStyle}
          />
          <label style={labelStyle}>Confirm New Password</label>
          <input
            type="password"
            value={passwords.confirmPassword}
            onChange={e => { setPasswords(p => ({ ...p, confirmPassword: e.target.value })); setPasswordSuccess('') }}
            required
            minLength={8}
            style={inputStyle}
          />
          <button type="submit" disabled={passwordSaving} style={btnStyle}>
            {passwordSaving ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

function StashSection() {
  const [bin, setBin] = useState([])
  const [binLoading, setBinLoading] = useState(true)
  const [confirmItem, setConfirmItem] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getBin()
      .then(setBin)
      .catch(err => setError(err.message))
      .finally(() => setBinLoading(false))
  }, [])

  async function handleSalvage(item) {
    try {
      await api.restoreItem(item._type, item._id)
      setBin(prev => prev.filter(i => i._id !== item._id))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleResuface(item) {
    try {
      await api.resurfaceItem(item._type, item._id)
      setBin(prev => prev.map(i => i._id === item._id ? { ...i, deletedAt: new Date().toISOString() } : i))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handlePermanentDelete() {
    try {
      await api.permanentDelete(confirmItem._type, confirmItem._id)
      setBin(prev => prev.filter(i => i._id !== confirmItem._id))
      setConfirmItem(null)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      {confirmItem && (
        <ConfirmModal
          message={`Permanently delete "${confirmItem.title}"? This cannot be undone.`}
          onDelete={handlePermanentDelete}
          onCancel={() => setConfirmItem(null)}
        />
      )}

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Stash</h2>
      <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Stashed items are lost after 30 days.
      </p>

      {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}

      {binLoading ? (
        <p style={{ color: '#555' }}>Loading…</p>
      ) : bin.length === 0 ? (
        <p style={{ color: '#555', fontSize: '0.875rem' }}>Cleaned Out</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {bin.map(item => {
            const left = daysLeft(item.deletedAt)
            return (
              <div key={item._id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                padding: '0.75rem 1rem'
              }}>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: TYPE_COLOR[item._type],
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  minWidth: 58,
                  flexShrink: 0
                }}>
                  {TYPE_LABEL[item._type]}
                </span>

                <span style={{ flex: 1, fontSize: '0.9rem', color: '#e5e5e5' }}>{item.title}</span>

                <span style={{ fontSize: '0.75rem', color: left <= 3 ? '#ef4444' : '#666', flexShrink: 0 }}>
                  {left}d left
                </span>

                <button
                  onClick={() => handleResuface(item)}
                  style={{ background: 'none', border: '1px solid #444', color: '#e5e5e5', padding: '0.3rem 0.7rem', borderRadius: 4, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 }}
                >
                  Resurface
                </button>
                <button
                  onClick={() => handleSalvage(item)}
                  style={{ background: 'none', border: '1px solid #166534', color: '#22c55e', padding: '0.3rem 0.7rem', borderRadius: 4, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 }}
                >
                  Salvage
                </button>
                <button
                  onClick={() => setConfirmItem(item)}
                  style={{ background: 'none', border: '1px solid #7f1d1d', color: '#ef4444', padding: '0.3rem 0.7rem', borderRadius: 4, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 }}
                >
                  Delete
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const card      = { background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '1.25rem 1.5rem' }
const subhead   = { fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }
const formCol   = { display: 'flex', flexDirection: 'column', gap: '0.6rem' }
const labelStyle = { fontSize: '0.8rem', color: '#888', marginBottom: '-0.2rem' }
const inputStyle = { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#e5e5e5', padding: '0.65rem 0.9rem', borderRadius: 6, fontSize: '0.9rem', outline: 'none' }
const btnStyle  = { background: '#e07820', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: 6, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start', marginTop: '0.25rem' }
const errorStyle   = { color: '#f87171', fontSize: '0.85rem', background: '#1a1a1a', padding: '0.5rem 0.75rem', borderRadius: 6, marginBottom: '0.5rem' }
const successStyle = { color: '#22c55e', fontSize: '0.85rem', background: '#1a1a1a', padding: '0.5rem 0.75rem', borderRadius: 6, marginBottom: '0.5rem' }
