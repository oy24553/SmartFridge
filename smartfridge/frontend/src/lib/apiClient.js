import axios from 'axios'
import { getAccessToken, getRefreshToken, setTokens, logout } from './auth.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let pendingRequests = []

const processQueue = (error, token = null) => {
  pendingRequests.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token)
  })
  pendingRequests = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (!original || original._retry) {
      throw error
    }

    if (error.response && error.response.status === 401) {
      const refresh = getRefreshToken()
      if (!refresh) {
        logout()
        throw error
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject })
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`
            original._retry = true
            return api(original)
          })
          .catch((err) => Promise.reject(err))
      }

      try {
        isRefreshing = true
        const { data } = await axios.post(
          `${api.defaults.baseURL}/api/auth/jwt/refresh/`,
          { refresh }
        )
        setTokens({ access: data.access, refresh })
        processQueue(null, data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        original._retry = true
        return api(original)
      } catch (e) {
        processQueue(e, null)
        logout()
        throw e
      } finally {
        isRefreshing = false
      }
    }

    throw error
  }
)

export default api

