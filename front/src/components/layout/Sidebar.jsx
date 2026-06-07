import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  BookOpen, FileText, Calendar, CheckSquare, StickyNote, MessageSquare,
  LogOut, User, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'
import useAuthStore from '../../store/authStore'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const menuItems = [
  { path: '/ledger', icon: BookOpen, label: '가계부' },
  { path: '/documents', icon: FileText, label: '서류 관리' },
  { path: '/schedule', icon: Calendar, label: '일정 관리' },
  { path: '/todo', icon: CheckSquare, label: '투두리스트' },
  { path: '/memo', icon: StickyNote, label: '메모장' },
  { path: '/chat', icon: MessageSquare, label: 'AI 챗봇' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const profilePicUrl = user?.profile_picture
    ? `${API_BASE}${user.profile_picture}`
    : null

  return (
    <aside
      className={`flex flex-col bg-slate-800 text-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      } min-h-screen flex-shrink-0`}
    >
      {/* Header + Toggle */}
      <div className={`flex h-16 items-center border-b border-slate-700 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 flex-shrink-0">
              <span className="text-sm font-bold">L</span>
            </div>
            <span className="text-lg font-bold tracking-tight whitespace-nowrap">Life Manager</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors flex-shrink-0"
          title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {menuItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={20} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Profile & Logout */}
      <div className="border-t border-slate-700 p-2 space-y-1">
        <button
          onClick={() => navigate('/profile')}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title={collapsed ? '프로필' : undefined}
        >
          {profilePicUrl ? (
            <img
              src={profilePicUrl}
              alt="profile"
              className="h-8 w-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
              <User size={16} />
            </div>
          )}
          {!collapsed && (
            <div className="text-left overflow-hidden">
              <p className="font-medium truncate">{user?.nickname || user?.email}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          )}
        </button>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          title={collapsed ? '로그아웃' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>로그아웃</span>}
        </button>
      </div>
    </aside>
  )
}
