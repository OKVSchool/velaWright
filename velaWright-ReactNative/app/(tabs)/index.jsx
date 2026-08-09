import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'
import ProjectCard from '../../components/ProjectCard'

export default function ProjectList() {
  const [projects, setProjects] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  async function load() {
    try {
      const data = await api.getProjects()
      setProjects(data)
    } catch { /* ignore */ }
  }

  useEffect(() => { load() }, [])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <ProjectCard project={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e07820" />}
        ListEmptyComponent={<Text style={styles.empty}>No projects yet. Create your first one!</Text>}
        contentContainerStyle={{ padding: 16, gap: 12 }}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/projects/new')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  empty: { color: '#555', textAlign: 'center', marginTop: 80, fontSize: 15 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#e07820', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 }
})
