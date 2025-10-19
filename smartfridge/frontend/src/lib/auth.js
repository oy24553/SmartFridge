import { create } from 'zustand'

const storageKey = {
  access: 'sp_access_token',
  refresh: 'sp_refresh_token',
}

const getStored = () => ({
  access: localStorage.getItem(storageKey.access) || null,
  refresh: localStorage.getItem(storageKey.refresh) || null,
})

const useAuth = create((set, get) => ({
  access: getStored().access,
  refresh: getStored().refresh,
  isAuthenticated: !!getStored().access,

  setTokens: ({ access, refresh }) => {
    if (access) localStorage.setItem(storageKey.access, access)
    if (refresh) localStorage.setItem(storageKey.refresh, refresh)
    set({ access, refresh, isAuthenticated: !!access })
  },

  clear: () => {
    localStorage.removeItem(storageKey.access)
    localStorage.removeItem(storageKey.refresh)
    set({ access: null, refresh: null, isAuthenticated: false })
  },
}))

export default useAuth
export const getAccessToken = () => useAuth.getState().access
export const getRefreshToken = () => useAuth.getState().refresh
export const setTokens = (tokens) => useAuth.getState().setTokens(tokens)
export const logout = () => useAuth.getState().clear()

