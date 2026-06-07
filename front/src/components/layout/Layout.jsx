import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import FloatingChat from '../common/FloatingChat'
import useAuthStore from '../../store/authStore'
import { profileAPI } from '../../api'

export default function Layout({ children }) {
  const { token, user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    if (!user) {
      profileAPI.getMe()
        .then((res) => setUser(res.data))
        .catch(() => navigate('/login'))
    }
  }, [token])

  if (!token) return null

  const isChatPage = location.pathname === '/chat'

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50">
        {children}
      </main>
      {!isChatPage && <FloatingChat />}
    </div>
  )
}
