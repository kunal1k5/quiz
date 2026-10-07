import axios from 'axios'

const isLocalPreview = typeof window !== 'undefined' && ['4173', '4174'].includes(window.location.port)

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (isLocalPreview ? 'http://localhost:5000/api' : '/api'),
  timeout: 10000,
})

export default api
