import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '../../context/AuthContext'

export default function Signup() {
  const { signup } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!form.name || !form.email || !form.password) return
    setLoading(true)
    try {
      await signup(form)
    } catch (err) {
      Alert.alert('Signup failed', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>velaWright</Text>
      <Text style={styles.subtitle}>Create your account</Text>

      <TextInput
        style={styles.input}
        placeholder="Full name"
        placeholderTextColor="#555"
        value={form.name}
        onChangeText={v => setForm(f => ({ ...f, name: v }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#555"
        keyboardType="email-address"
        autoCapitalize="none"
        value={form.email}
        onChangeText={v => setForm(f => ({ ...f, email: v }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min 6 chars)"
        placeholderTextColor="#555"
        secureTextEntry
        value={form.password}
        onChangeText={v => setForm(f => ({ ...f, password: v }))}
      />

      <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Creating account…' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" style={styles.link}>
        Already have an account? Log in
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#e07820', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', color: '#e5e5e5', padding: 14, borderRadius: 8, fontSize: 16, marginBottom: 12 },
  btn: { backgroundColor: '#e07820', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: '#e07820', textAlign: 'center', marginTop: 20, fontSize: 14 }
})
