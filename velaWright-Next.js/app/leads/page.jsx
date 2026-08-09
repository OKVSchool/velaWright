'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import LeadPanel from '@/components/LeadPanel'
import TracePanel from '@/components/TracePanel'
import EndeavorPanel from '@/components/EndeavorPanel'

const TABS = ['traces', 'leads', 'endeavors']

const TYPE_COLORS = {
  Endeavor: '#3b82f6',
  Lead:     '#e07820',
  Trace:    '#a78bfa',
  Mark:     '#22c55e',
}

export default function VentureList() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState('traces')
  const [leads, setLeads] = useState([])
  const [traces, setTraces] = useState([])
  const [endeavors, setEndeavors] = useState([])
  const [marks, setMarks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [error, setError] = useState('')
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    Promise.all([
      api.getLeads(),
      api.getTraces(),
      api.getEndeavors(),
      api.getMarks(),
    ])
      .then(([leads, traces, endeavors, marks]) => {
        setLeads(leads)
        setTraces(traces)
        setEndeavors(endeavors)
        setMarks(marks)
      })
      .catch(err => setError(err.message))
      .finally(() => setDataLoading(false))
  }, [user])

  const refreshLeads = () => api.getLeads().then(setLeads)
  const refreshTraces = () => api.getTraces().then(setTraces)
  const refreshEndeavors = () => api.getEndeavors().then(setEndeavors)

  function handleNavigate({ tab, activeId }) {
    setSearchQuery('')
    setTab(tab)
    setActiveId(activeId)
  }

  if (loading || !user) return <p>Loading…</p>
  if (dataLoading) return <p>Loading…</p>

  const searching = searchQuery.trim().length > 0

  return (
    <div>
      <div className="ideas-header">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Leads & Planning</h1>
        <div className="search-box">
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setActiveId(null) }}
            placeholder="Search everything…"
            aria-label="Search endeavors, leads, traces, and marks"
            style={{
              width: '100%',
              background: '#1a1a1a',
              border: `1px solid ${searching ? '#e07820' : '#2a2a2a'}`,
              color: '#e5e5e5',
              padding: '0.5rem 2rem 0.5rem 0.85rem',
              borderRadius: 6,
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searching && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1, padding: 0 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {error && (
        <p style={{ color: '#f87171', background: '#1a1a1a', border: '1px solid #f871711a', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      {searching ? (
        <SearchResults
          query={searchQuery.trim()}
          endeavors={endeavors}
          leads={leads}
          traces={traces}
          marks={marks}
          onNavigate={handleNavigate}
        />
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #2a2a2a' }}>
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: tab === t ? '#e07820' : '#888',
                  fontWeight: tab === t ? 600 : 400,
                  padding: '0.5rem 1rem',
                  borderBottom: tab === t ? '2px solid #e07820' : '2px solid transparent',
                  fontSize: '0.9rem',
                  textTransform: 'capitalize',
                  cursor: 'pointer'
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'traces' && <TracesTab traces={traces} refresh={refreshTraces} activeId={activeId} />}
          {tab === 'leads' && <LeadsTab leads={leads} traces={traces} refresh={refreshLeads} refreshTraces={refreshTraces} activeId={activeId} />}
          {tab === 'endeavors' && <EndeavorTab endeavors={endeavors} traces={traces} refresh={refreshEndeavors} refreshTraces={refreshTraces} activeId={activeId} />}
        </>
      )}
    </div>
  )
}

function SearchResults({ query, endeavors, leads, traces, marks, onNavigate }) {
  const q = query.toLowerCase()
  const match = (...fields) => fields.some(f => typeof f === 'string' && f.toLowerCase().includes(q))
  const results = []

  endeavors.forEach(e => {
    if (match(e.title, e.description, e.framework, e.status, ...(e.tags || []))) {
      results.push({ type: 'Endeavor', title: e.title, meta: [e.status, e.framework].filter(Boolean), context: null, navigateTo: { tab: 'endeavors', activeId: e._id } })
    }
  })

  leads.forEach(lead => {
    if (match(lead.title, lead.description, lead.category, lead.status, lead.priority)) {
      results.push({ type: 'Lead', title: lead.title, meta: [lead.priority !== 'none' && lead.priority, lead.status].filter(Boolean), context: null, navigateTo: { tab: 'leads', activeId: lead._id } })
    }
  })

  traces.forEach(t => {
    if (match(t.title, t.category)) {
      const parentEndeavor = t.projectId ? endeavors.find(e => e._id === t.projectId) : null
      const parentLead     = t.ideaId    ? leads.find(l => l._id === t.ideaId)        : null
      const context = parentEndeavor ? `in endeavor: ${parentEndeavor.title}`
        : parentLead ? `in lead: ${parentLead.title}`
        : 'standalone'
      const navigateTo = parentEndeavor ? { tab: 'endeavors', activeId: parentEndeavor._id }
        : parentLead ? { tab: 'leads', activeId: parentLead._id }
        : { tab: 'traces', activeId: t._id }
      results.push({ type: 'Trace', title: t.title, meta: t.category ? [t.category] : [], context, navigateTo })
    }
  })

  marks.forEach(mark => {
    if (match(mark.title, mark.notes)) {
      const parentEndeavor = mark.projectId ? endeavors.find(e => e._id === mark.projectId) : null
      const context = parentEndeavor ? `in endeavor: ${parentEndeavor.title}` : null
      const navigateTo = parentEndeavor ? { tab: 'endeavors', activeId: parentEndeavor._id } : null
      results.push({ type: 'Mark', title: mark.title, meta: [mark.done ? 'done' : 'open'], context, navigateTo })
    }
  })

  if (results.length === 0) {
    return <p style={{ color: '#888', marginTop: '2rem' }}>No results for &ldquo;{query}&rdquo;</p>
  }

  return (
    <div>
      <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '1rem' }}>
        {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo; — click to go there
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {results.map((r, i) => (
          <div
            key={i}
            onClick={() => r.navigateTo && onNavigate(r.navigateTo)}
            style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '0.75rem 1rem', cursor: r.navigateTo ? 'pointer' : 'default' }}
            onMouseEnter={e => { if (r.navigateTo) e.currentTarget.style.borderColor = '#444' }}
            onMouseLeave={e => { if (r.navigateTo) e.currentTarget.style.borderColor = '#2a2a2a' }}
          >
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: TYPE_COLORS[r.type], textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0, minWidth: 54 }}>
              {r.type}
            </span>
            <span style={{ flex: 1, fontSize: '0.9rem', color: '#e5e5e5' }}>
              {highlight(r.title, query)}
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
              {r.meta.map(m => (
                <span key={m} style={{ fontSize: '0.7rem', color: '#666', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 4, padding: '0.1rem 0.4rem' }}>
                  {highlight(m, query)}
                </span>
              ))}
              {r.context && (
                <span style={{ fontSize: '0.7rem', color: '#888', fontStyle: 'italic' }}>
                  {highlight(r.context, query)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function highlight(text, query) {
  if (!text || !query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#e0782033', color: '#e07820', borderRadius: 2, padding: 0 }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function TracesTab({ traces, refresh, activeId }) {
  const standalone = traces.filter(t => !t.ideaId && !t.projectId)
  return (
    <div>
      <AddTraceForm onAdd={refresh} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        {standalone.length === 0 ? (
          <p style={{ color: '#555' }}>Uncharted Waters</p>
        ) : standalone.map(t => <TracePanel key={t._id} trace={t} onDelete={refresh} isActive={activeId === t._id} />)}
      </div>
    </div>
  )
}

function LeadsTab({ leads, traces, refresh, refreshTraces, activeId }) {
  return (
    <div>
      <AddLeadForm onAdd={refresh} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        {leads.length === 0 ? (
          <p style={{ color: '#555' }}>Uncharted Waters</p>
        ) : leads.map(lead => (
          <LeadPanel key={lead._id} lead={lead} traces={traces.filter(t => t.ideaId === lead._id)} onUpdate={refresh} onUpdateTraces={refreshTraces} isActive={activeId === lead._id} />
        ))}
      </div>
    </div>
  )
}

function EndeavorTab({ endeavors, traces, refresh, refreshTraces, activeId }) {
  const router = useRouter()
  return (
    <div>
      <button onClick={() => router.push('/endeavors/new')} style={btnStyle}>
        + New Endeavor
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        {endeavors.length === 0 ? (
          <p style={{ color: '#555' }}>Uncharted Waters</p>
        ) : endeavors.map(e => (
          <EndeavorPanel key={e._id} endeavor={e} traces={traces.filter(t => t.projectId === e._id)} onUpdate={refresh} onUpdateTraces={refreshTraces} isActive={activeId === e._id} />
        ))}
      </div>
    </div>
  )
}

function AddTraceForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [open, setOpen] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    await api.createTrace({ title })
    setTitle('')
    setOpen(false)
    onAdd()
  }

  return open ? (
    <form onSubmit={submit} style={{ display: 'flex', gap: '0.5rem' }}>
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="New trace…" style={inputStyle} />
      <button type="submit" style={btnStyle}>Add</button>
      <button type="button" onClick={() => setOpen(false)} style={{ ...btnStyle, background: '#2a2a2a' }}>Cancel</button>
    </form>
  ) : (
    <button onClick={() => setOpen(true)} style={btnStyle}>+ New Trace</button>
  )
}

function AddLeadForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [open, setOpen] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    await api.createLead({ title })
    setTitle('')
    setOpen(false)
    onAdd()
  }

  return open ? (
    <form onSubmit={submit} style={{ display: 'flex', gap: '0.5rem' }}>
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="New lead…" style={inputStyle} />
      <button type="submit" style={btnStyle}>Add</button>
      <button type="button" onClick={() => setOpen(false)} style={{ ...btnStyle, background: '#2a2a2a' }}>Cancel</button>
    </form>
  ) : (
    <button onClick={() => setOpen(true)} style={btnStyle}>+ New Lead</button>
  )
}

const inputStyle = {
  flex: 1,
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  color: '#e5e5e5',
  padding: '0.6rem 0.9rem',
  borderRadius: 6,
  fontSize: '0.9rem'
}

const btnStyle = {
  background: '#e07820',
  color: '#fff',
  border: 'none',
  padding: '0.6rem 1rem',
  borderRadius: 6,
  fontWeight: 600,
  cursor: 'pointer'
}
