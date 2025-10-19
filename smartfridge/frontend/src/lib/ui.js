import { create } from 'zustand'

const storageKey = 'sp_anim_enabled'

const getStored = () => {
  if (typeof window === 'undefined') return true
  const v = localStorage.getItem(storageKey)
  if (v == null) return true
  return v === '1'
}

const useUI = create((set, get) => ({
  animEnabled: getStored(),
  setAnimEnabled: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, enabled ? '1' : '0')
      document.documentElement.setAttribute('data-anim', enabled ? 'on' : 'off')
    }
    set({ animEnabled: enabled })
  },
  toggleAnim: () => {
    const next = !get().animEnabled
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, next ? '1' : '0')
      document.documentElement.setAttribute('data-anim', next ? 'on' : 'off')
    }
    set({ animEnabled: next })
  },
}))

export default useUI

