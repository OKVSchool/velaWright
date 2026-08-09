'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('vw_user')
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  async function signup(data) {
    const { token, user } = await api.signup(data)
    localStorage.setItem('vw_token', token)
    localStorage.setItem('vw_user', JSON.stringify(user))
    setUser(user)
    router.push('/')
  }

  async function login(data) {
    const { token, user } = await api.login(data)
    localStorage.setItem('vw_token', token)
    localStorage.setItem('vw_user', JSON.stringify(user))
    setUser(user)
    router.push('/')
  }

  function logout() {
    localStorage.removeItem('vw_token')
    localStorage.removeItem('vw_user')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
