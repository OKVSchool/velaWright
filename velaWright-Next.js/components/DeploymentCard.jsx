'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Chevron from './Chevron'

const ORIGIN_CHEVRON = { lead: 'basic', endeavor: 'ornate', trace: 'grand' }

const STATUS_COLORS = {
  active:    '#3b82f6',
  completed: '#e07820',
  paused:    '#f59e0b',
  deployed:  '#22c55e'
}

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function DeploymentCard({ endeavor }) {
  const router = useRouter()
  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      {endeavor.imageUrl && (
        <div style={{ position: 'relative', width: '100%', height: 160 }}>
          <Image
            src={`${process.env.NEXT_PUBLIC_API_URL}${endeavor.imageUrl}`}
            alt={endeavor.title}
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}
      <div style={{ padding: '1.25rem' }}>

        {/* Title + status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            {endeavor.title}
            {endeavor.origin && <Chevron type={ORIGIN_CHEVRON[endeavor.origin]} />}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.7rem', fontWeight: 600,
              color: STATUS_COLORS[endeavor.status] || '#888',
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              {endeavor.status}
            </span>
            <button
              onClick={() => router.push(`/deployments/${endeavor._id}`)}
              style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.7rem', cursor: 'pointer' }}
            >
              Edit
            </button>
          </div>
        </div>

        {/* Description */}
        {endeavor.description && (
          <p style={{ color: '#aaa', fontSize: '0.875rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
            {endeavor.description.length > 100 ? endeavor.description.slice(0, 100) + '…' : endeavor.description}
          </p>
        )}

        {/* Badges row */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
          {endeavor.framework && (
            <span style={{ fontSize: '0.75rem', background: '#2a2a2a', padding: '0.2rem 0.5rem', borderRadius: 4, color: '#aaa' }}>
              {endeavor.framework}
            </span>
          )}
          {endeavor.platform && (
            <span style={{ fontSize: '0.75rem', background: '#2a2a2a', padding: '0.2rem 0.5rem', borderRadius: 4, color: '#aaa' }}>
              {endeavor.platform}
            </span>
          )}
          {endeavor.version && (
            <span style={{ fontSize: '0.75rem', background: '#e0782022', color: '#e07820', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
              {endeavor.version}
            </span>
          )}
          {endeavor.launchDate && (
            <span style={{ fontSize: '0.75rem', color: '#666' }}>
              Launched {formatDate(endeavor.launchDate)}
            </span>
          )}
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: endeavor.collaborators?.length || endeavor.tags?.length ? '0.75rem' : 0 }}>
          {endeavor.liveUrl && (
            <a href={endeavor.liveUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.8rem', color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}>
              Live ↗
            </a>
          )}
          {endeavor.repoUrl && (
            <a href={endeavor.repoUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.8rem', color: '#e07820', textDecoration: 'none' }}>
              Repo ↗
            </a>
          )}
          {endeavor.demoUrl && (
            <a href={endeavor.demoUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.8rem', color: '#a78bfa', textDecoration: 'none' }}>
              Demo ↗
            </a>
          )}
        </div>

        {/* Collaborators */}
        {endeavor.collaborators?.length > 0 && (
          <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
            With: {endeavor.collaborators.join(', ')}
          </div>
        )}

        {/* Tags */}
        {endeavor.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {endeavor.tags.map(tag => (
              <span key={tag} style={{ fontSize: '0.7rem', background: '#e0782022', color: '#e07820', padding: '0.15rem 0.4rem', borderRadius: 4 }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
