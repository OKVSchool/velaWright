import { Tabs, Redirect } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { ActivityIndicator, View } from 'react-native'

export default function TabLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' }}>
        <ActivityIndicator color="#e07820" />
      </View>
    )
  }

  if (!user) return <Redirect href="/(auth)/login" />

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#1a1a1a', borderTopColor: '#2a2a2a' },
        tabBarActiveTintColor: '#e07820',
        tabBarInactiveTintColor: '#555',
        headerStyle: { backgroundColor: '#1a1a1a' },
        headerTintColor: '#e5e5e5',
        headerTitleStyle: { fontWeight: '700' }
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Projects', tabBarLabel: 'Projects' }} />
      <Tabs.Screen name="ideas" options={{ title: 'Ideas', tabBarLabel: 'Ideas' }} />
    </Tabs>
  )
}
