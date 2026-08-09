'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import DeploymentCard from '@/components/DeploymentCard'

export default function DeploymentList() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [endeavors, setEndeavors] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    api.getEndeavors()
      .then(all => setEndeavors(all.filter(e => e.status === 'deployed')))
      .catch(err => setError(err.message))
  }, [user])

  if (loading) return <p>Loading...</p>
  if (!user) return null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Deployments</h1>
        <button
          onClick={() => router.push('/deployments/new')}
          style={{ background: '#e07820', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: 6, fontWeight: 600 }}
        >
          + New Deployment
        </button>
      </div>

      {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}

      {endeavors.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', marginTop: '4rem' }}>
          Uncharted Waters
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {endeavors.map(endeavor => (
            <DeploymentCard key={endeavor._id} endeavor={endeavor} />
          ))}
        </div>
      )}
    </div>
  )
}
