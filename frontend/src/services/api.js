import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

export async function planTrip(payload) {
  const response = await api.post('/api/trips/plan/', payload)
  return response.data
}

export default api
