import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'

export default function NewProject() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    framework: '',
    repoUrl: '',
    tags: '',
    status: 'active'
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!form.title.trim()) {
      Alert.alert('Required', 'Project title is required')
      return
    }
    setSubmitting(true)
    try {
      const project = await api.createProject({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
      })
      router.replace(`/projects/${project._id}`)
    } catch (err) {
      Alert.alert('Error', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, gap: 14 }}>
      <Text style={styles.heading}>New Project</Text>

      <TextInput style={styles.input} value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="Project title *" placeholderTextColor="#555" />
      <TextInput style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Description" placeholderTextColor="#555" multiline />
      <TextInput style={styles.input} value={form.framework} onChangeText={v => setForm(f => ({ ...f, framework: v }))} placeholder="Framework" placeholderTextColor="#555" />
      <TextInput style={styles.input} value={form.repoUrl} onChangeText={v => setForm(f => ({ ...f, repoUrl: v }))} placeholder="Repo URL" placeholderTextColor="#555" autoCapitalize="none" />
      <TextInput style={styles.input} value={form.tags} onChangeText={v => setForm(f => ({ ...f, tags: v }))} placeholder="Tags (comma-separated)" placeholderTextColor="#555" />

      <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.btnText}>{submitting ? 'Creating…' : 'Create Project'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  heading: { fontSize: 22, fontWeight: '700', color: '#e5e5e5', marginBottom: 6 },
  input: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', color: '#e5e5e5', padding: 14, borderRadius: 8, fontSize: 15 },
  btn: { backgroundColor: '#e07820', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 }
})
