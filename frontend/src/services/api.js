import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tasteloop-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshRequest = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const refreshToken = localStorage.getItem('tasteloop-refresh-token')
    if (error.response?.status === 401 && refreshToken && !original?._retried && !original?.url?.includes('/auth/refresh')) {
      original._retried = true
      try {
        refreshRequest ||= axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: refreshToken })
        const { data } = await refreshRequest
        localStorage.setItem('tasteloop-token', data.access_token)
        localStorage.setItem('tasteloop-refresh-token', data.refresh_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        // The shared cleanup below handles an expired or revoked refresh token.
      } finally {
        refreshRequest = null
      }
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('tasteloop-token')
      localStorage.removeItem('tasteloop-refresh-token')
      localStorage.removeItem('tasteloop-user')
      if (window.location.pathname !== '/login') {
        window.location.replace(`/login?from=${encodeURIComponent(window.location.pathname)}`)
      }
    }
    return Promise.reject(error)
  },
)

export const apiError = (error) => {
  const detail = error.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (detail?.message) return detail.message
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join('. ')
  return error.message || 'Something went wrong. Please try again.'
}

export const saveSession = (data) => {
  localStorage.setItem('tasteloop-token', data.access_token)
  localStorage.setItem('tasteloop-refresh-token', data.refresh_token)
  localStorage.setItem('tasteloop-user', JSON.stringify(data.user))
}

export const currentUser = () => {
  try { return JSON.parse(localStorage.getItem('tasteloop-user')) } catch { return null }
}

export default api
