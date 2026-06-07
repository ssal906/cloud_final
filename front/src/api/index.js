import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
export { API_BASE }

// Auth
export const authAPI = {
  checkEmail: (email) => api.post('/auth/check-email', { email }),
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
}

// Profile
export const profileAPI = {
  getMe: () => api.get('/profile/me'),
  update: (data) => api.put('/profile/me', data),
  changePassword: (data) => api.post('/profile/change-password', data),
  uploadPicture: (formData) => api.post('/profile/picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

// Ledger
export const ledgerAPI = {
  getSummary: (year, month) => api.get('/ledger/summary', { params: { year, month } }),
  create: (data) => api.post('/ledger/', data),
  update: (id, data) => api.put(`/ledger/${id}`, data),
  delete: (id) => api.delete(`/ledger/${id}`),
}

// Documents
export const documentAPI = {
  list: () => api.get('/documents/'),
  create: (formData) => api.post('/documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  downloadUrl: (id) => `${API_BASE}/documents/${id}/download`,
  fetchBlob: async (id) => {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/documents/${id}/view`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('파일을 불러올 수 없습니다.')
    return res.blob()
  },
}

// Schedules
export const scheduleAPI = {
  list: (start, end) => api.get('/schedules/', { params: { start, end } }),
  create: (data) => api.post('/schedules/', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
}

// Todos
export const todoAPI = {
  list: (params = {}) => api.get('/todos/', { params }),
  getStats: (year, month) => api.get('/todos/stats', { params: { year, month } }),
  cleanup: () => api.delete('/todos/cleanup'),
  create: (data) => api.post('/todos/', data),
  update: (id, data) => api.put(`/todos/${id}`, data),
  toggle: (id) => api.patch(`/todos/${id}/toggle`),
  delete: (id) => api.delete(`/todos/${id}`),
}

// Memos
export const memoAPI = {
  listFolders: () => api.get('/memos/folders'),
  createFolder: (data) => api.post('/memos/folders', data),
  deleteFolder: (id) => api.delete(`/memos/folders/${id}`),
  list: (folderId) => api.get('/memos/', { params: folderId !== undefined ? { folder_id: folderId } : {} }),
  create: (data) => api.post('/memos/', data),
  update: (id, data) => api.put(`/memos/${id}`, data),
  delete: (id) => api.delete(`/memos/${id}`),
}

// Chat
export const chatAPI = {
  getHistory: () => api.get('/chat/history'),
  send: (message) => api.post('/chat/', { message }),
}
