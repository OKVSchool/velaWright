import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '../../lib/api'

export default function ProjectDetail() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  useEffect(() => {
    api.getProject(id).then(setProject)
    api.getTasks({ projectId: id }).then(setTasks)
  }, [id])

  async function toggleTask(task) {
    const updated = await api.updateTask(task._id, { done: !task.done })
    setTasks(prev => prev.map(t => t._id === updated._id ? updated : t))
  }

  async function addTask() {
    if (!newTask.trim()) return
    const task = await api.createTask({ title: newTask, projectId: id })
    setTasks(prev => [task, ...prev])
    setNewTask('')
    setAddingTask(false)
  }

  async function deleteProject() {
    Alert.alert('Delete project?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.deleteProject(id); router.back() } }
    ])
  }

  if (!project) return (
    <View style={{ flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#e07820" />
    </View>
  )

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, gap: 20 }}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{project.title}</Text>
          {project.framework && <Text style={styles.meta}>{project.framework} · {project.status}</Text>}
        </View>
        <TouchableOpacity onPress={deleteProject}>
          <Text style={{ color: '#dc2626', fontSize: 13 }}>Delete</Text>
        </TouchableOpacity>
      </View>

      {project.description ? <Text style={styles.description}>{project.description}</Text> : null}

      {project.tags?.length > 0 && (
        <View style={styles.tagRow}>
          {project.tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          <TouchableOpacity onPress={() => setAddingTask(a => !a)}>
            <Text style={{ color: '#e07820', fontSize: 14 }}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {addingTask && (
          <View style={styles.addRow}>
            <TextInput
              autoFocus
              style={styles.addInput}
              value={newTask}
              onChangeText={setNewTask}
              placeholder="Task title…"
              placeholderTextColor="#555"
              onSubmitEditing={addTask}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addTask}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}

        {tasks.length === 0 ? (
          <Text style={{ color: '#555', fontSize: 14 }}>No tasks yet.</Text>
        ) : tasks.map(task => (
          <TouchableOpacity key={task._id} style={styles.task} onPress={() => toggleTask(task)}>
            <View style={[styles.checkbox, task.done && styles.checkboxDone]}>
              {task.done && <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>}
            </View>
            <Text style={[styles.taskTitle, task.done && styles.taskDone]}>{task.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#e5e5e5', marginBottom: 4 },
  meta: { color: '#888', fontSize: 13 },
  description: { color: '#aaa', fontSize: 15, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#e0782022', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  tagText: { color: '#e07820', fontSize: 12 },
  section: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 10, padding: 16, gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontWeight: '700', fontSize: 16, color: '#e5e5e5' },
  task: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#444', alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: '#e07820', borderColor: '#e07820' },
  taskTitle: { flex: 1, color: '#e5e5e5', fontSize: 15 },
  taskDone: { color: '#555', textDecorationLine: 'line-through' },
  addRow: { flexDirection: 'row', gap: 8 },
  addInput: { flex: 1, backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: '#333', color: '#e5e5e5', padding: 10, borderRadius: 6, fontSize: 14 },
  addBtn: { backgroundColor: '#e07820', paddingHorizontal: 14, borderRadius: 6, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' }
})
