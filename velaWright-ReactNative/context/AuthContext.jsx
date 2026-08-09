import { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    AsyncStorage.getItem('ph_user').then(stored => {
      if (stored) setUser(JSON.parse(stored))
      setLoading(false)
    })
  }, [])

  async function signup(data) {
    const { token, user } = await api.signup(data)
    await AsyncStorage.setItem('ph_token', token)
    await AsyncStorage.setItem('ph_user', JSON.stringify(user))
    setUser(user)
    router.replace('/(tabs)')
  }

  async function login(data) {
    const { token, user } = await api.login(data)
    await AsyncStorage.setItem('ph_token', token)
    await AsyncStorage.setItem('ph_user', JSON.stringify(user))
    setUser(user)
    router.replace('/(tabs)')
  }

  async function logout() {
    await AsyncStorage.removeItem('ph_token')
    await AsyncStorage.removeItem('ph_user')
    setUser(null)
    router.replace('/(auth)/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
