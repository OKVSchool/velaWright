import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a1a' },
        headerTintColor: '#e07820',
        headerTitleStyle: { fontWeight: '700' }
      }}
    />
  )
}
