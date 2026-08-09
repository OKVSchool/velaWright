import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'

async function getToken() {
  return AsyncStorage.getItem('ph_token')
}

async function request(path, options = {}) {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  getProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (body) => request('/projects', { method: 'POST', body: JSON.stringify(body) }),
  updateProject: (id, body) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  getIdeas: () => request('/ideas'),
  createIdea: (body) => request('/ideas', { method: 'POST', body: JSON.stringify(body) }),
  updateIdea: (id, body) => request(`/ideas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteIdea: (id) => request(`/ideas/${id}`, { method: 'DELETE' }),

  getThoughts: () => request('/thoughts'),
  createThought: (body) => request('/thoughts', { method: 'POST', body: JSON.stringify(body) }),
  updateThought: (id, body) => request(`/thoughts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteThought: (id) => request(`/thoughts/${id}`, { method: 'DELETE' }),

  getTasks: (query = {}) => {
    const params = new URLSearchParams(query).toString()
    return request(`/tasks${params ? `?${params}` : ''}`)
  },
  createTask: (body) => request('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id, body) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' })
}
