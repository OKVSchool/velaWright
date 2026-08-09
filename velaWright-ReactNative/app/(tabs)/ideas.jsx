import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl, TextInput, Alert } from 'react-native'
import { api } from '../../lib/api'

const TABS = ['thoughts', 'ideas', 'projects']

export default function ProjectIdeas() {
  const [tab, setTab] = useState('ideas')
  const [ideas, setIdeas] = useState([])
  const [thoughts, setThoughts] = useState([])
  const [projects, setProjects] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    const [i, t, p] = await Promise.all([api.getIdeas(), api.getThoughts(), api.getProjects()])
    setIdeas(i)
    setThoughts(t)
    setProjects(p)
  }

  useEffect(() => { load() }, [])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e07820" />}
      >
        {tab === 'thoughts' && <ThoughtsTab thoughts={thoughts.filter(t => !t.ideaId && !t.projectId)} onRefresh={load} />}
        {tab === 'ideas' && <IdeasTab ideas={ideas} thoughts={thoughts} onRefresh={load} />}
        {tab === 'projects' && <ProjectsTab projects={projects} />}
      </ScrollView>
    </View>
  )
}

function ThoughtsTab({ thoughts, onRefresh }) {
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)

  async function addThought() {
    if (!title.trim()) return
    await api.createThought({ title })
    setTitle('')
    setAdding(false)
    onRefresh()
  }

  return (
    <View style={{ gap: 10 }}>
      {adding ? (
        <View style={styles.addRow}>
          <TextInput autoFocus style={styles.addInput} value={title} onChangeText={setTitle} placeholder="New thought…" placeholderTextColor="#555" />
          <TouchableOpacity onPress={addThought} style={styles.addBtn}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addTrigger} onPress={() => setAdding(true)}>
          <Text style={styles.addTriggerText}>+ New Thought</Text>
        </TouchableOpacity>
      )}
      {thoughts.map(t => (
        <View key={t._id} style={styles.card}>
          <Text style={styles.cardIcon}>💭</Text>
          <Text style={styles.cardTitle}>{t.title}</Text>
        </View>
      ))}
    </View>
  )
}

function IdeasTab({ ideas, thoughts, onRefresh }) {
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState({})

  async function addIdea() {
    if (!title.trim()) return
    await api.createIdea({ title })
    setTitle('')
    setAdding(false)
    onRefresh()
  }

  async function deleteIdea(id) {
    Alert.alert('Delete idea?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.deleteIdea(id); onRefresh() } }
    ])
  }

  return (
    <View style={{ gap: 10 }}>
      {adding ? (
        <View style={styles.addRow}>
          <TextInput autoFocus style={styles.addInput} value={title} onChangeText={setTitle} placeholder="New idea…" placeholderTextColor="#555" />
          <TouchableOpacity onPress={addIdea} style={styles.addBtn}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addTrigger} onPress={() => setAdding(true)}>
          <Text style={styles.addTriggerText}>+ New Idea</Text>
        </TouchableOpacity>
      )}
      {ideas.map(idea => {
        const nested = thoughts.filter(t => t.ideaId === idea._id)
        const isOpen = expanded[idea._id]
        return (
          <View key={idea._id} style={styles.accordion}>
            <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpanded(e => ({ ...e, [idea._id]: !e[idea._id] }))}>
              <Text style={styles.chevron}>{isOpen ? '▼' : '▶'}</Text>
              <Text style={styles.cardTitle}>{idea.title}</Text>
              <Text style={[styles.priority, { color: idea.priority === 'high' ? '#ef4444' : idea.priority === 'medium' ? '#f59e0b' : '#22c55e' }]}>
                {idea.priority}
              </Text>
            </TouchableOpacity>
            {isOpen && nested.map(t => (
              <View key={t._id} style={styles.nestedThought}>
                <Text style={styles.cardIcon}>💭</Text>
                <Text style={styles.cardText}>{t.title}</Text>
              </View>
            ))}
          </View>
        )
      })}
    </View>
  )
}

function ProjectsTab({ projects }) {
  return (
    <View style={{ gap: 10 }}>
      {projects.map(p => (
        <View key={p._id} style={styles.card}>
          <Text style={styles.cardTitle}>{p.title}</Text>
          <Text style={styles.cardText}>{p.status}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  tabBar: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#e07820' },
  tabText: { color: '#555', fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: '#e07820', fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 8, padding: 12 },
  accordion: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 8, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  chevron: { color: '#555', fontSize: 11 },
  nestedThought: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingLeft: 28, borderTopWidth: 1, borderTopColor: '#2a2a2a', backgroundColor: '#0f0f0f' },
  cardIcon: { fontSize: 16 },
  cardTitle: { flex: 1, color: '#e5e5e5', fontWeight: '500', fontSize: 15 },
  cardText: { color: '#888', fontSize: 13 },
  priority: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  addRow: { flexDirection: 'row', gap: 8 },
  addInput: { flex: 1, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', color: '#e5e5e5', padding: 10, borderRadius: 8, fontSize: 15 },
  addBtn: { backgroundColor: '#e07820', padding: 10, borderRadius: 8, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' },
  addTrigger: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 8, padding: 12, alignItems: 'center' },
  addTriggerText: { color: '#e07820', fontWeight: '600' }
})
