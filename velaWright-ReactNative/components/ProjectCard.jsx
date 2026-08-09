import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'

const STATUS_COLORS = { active: '#3b82f6', completed: '#e07820', paused: '#f59e0b', deployed: '#22c55e' }

export default function ProjectCard({ project }) {
  const router = useRouter()

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/projects/${project._id}`)}>
      <View style={styles.row}>
        <Text style={styles.title}>{project.title}</Text>
        <Text style={[styles.status, { color: STATUS_COLORS[project.status] || '#888' }]}>
          {project.status}
        </Text>
      </View>
      {project.description ? (
        <Text style={styles.desc} numberOfLines={2}>{project.description}</Text>
      ) : null}
      {project.framework ? <Text style={styles.framework}>{project.framework}</Text> : null}
      {project.tags?.length > 0 && (
        <View style={styles.tagRow}>
          {project.tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 10, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '600', color: '#e5e5e5', flex: 1, marginRight: 8 },
  status: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  desc: { color: '#aaa', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  framework: { fontSize: 12, color: '#888', backgroundColor: '#2a2a2a', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag: { backgroundColor: '#e0782022', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { color: '#e07820', fontSize: 11 }
})
