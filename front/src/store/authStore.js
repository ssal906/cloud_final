import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),

  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    set({ user, token })
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
}))

export default useAuthStore
