import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Ledger from './pages/Ledger'
import Documents from './pages/Documents'
import Schedule from './pages/Schedule'
import Todo from './pages/Todo'
import Memo from './pages/Memo'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import useAuthStore from './store/authStore'

function ProtectedRoute({ children }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/ledger" replace />} />
        <Route path="/ledger" element={<ProtectedRoute><Ledger /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
        <Route path="/todo" element={<ProtectedRoute><Todo /></ProtectedRoute>} />
        <Route path="/memo" element={<ProtectedRoute><Memo /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
