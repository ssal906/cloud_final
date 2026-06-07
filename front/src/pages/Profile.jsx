import { useState, useRef } from 'react'
import { Camera, Save, Lock, User } from 'lucide-react'
import { profileAPI } from '../api'
import useAuthStore from '../store/authStore'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const [profileForm, setProfileForm] = useState({
    nickname: user?.nickname || '',
    gender: user?.gender || '',
  })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [profileMsg, setProfileMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')
  const fileInputRef = useRef(null)

  const handleProfileSave = async () => {
    try {
      const res = await profileAPI.update({
        nickname: profileForm.nickname,
        gender: profileForm.gender || null,
      })
      setUser(res.data)
      setProfileMsg('프로필이 저장되었습니다.')
      setTimeout(() => setProfileMsg(''), 3000)
    } catch (e) {
      setProfileMsg('저장에 실패했습니다.')
    }
  }

  const handlePasswordChange = async () => {
    setPwError('')
    if (pwForm.new_password.length < 6) return setPwError('새 비밀번호는 6자 이상이어야 합니다.')
    if (pwForm.new_password !== pwForm.confirm) return setPwError('새 비밀번호가 일치하지 않습니다.')

    try {
      await profileAPI.changePassword({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      })
      setPwForm({ current_password: '', new_password: '', confirm: '' })
      setPwMsg('비밀번호가 변경되었습니다.')
      setTimeout(() => setPwMsg(''), 3000)
    } catch (e) {
      setPwError(e.response?.data?.detail || '비밀번호 변경에 실패했습니다.')
    }
  }

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await profileAPI.uploadPicture(fd)
      setUser(res.data)
    } catch (e) {
      alert('이미지 업로드에 실패했습니다.')
    }
  }

  const profilePicUrl = user?.profile_picture ? `${API_BASE}${user.profile_picture}` : null

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">프로필 설정</h1>
        <p className="text-sm text-gray-500 mt-0.5">계정 정보를 관리하세요</p>
      </div>

      {/* Profile Picture & Basic Info */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-4">
        <div className="flex items-start gap-6">
          <div className="relative flex-shrink-0">
            {profilePicUrl ? (
              <img
                src={profilePicUrl}
                alt="profile"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center">
                <User size={32} className="text-indigo-400" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm hover:bg-indigo-700"
            >
              <Camera size={13} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePictureUpload}
            />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
              <input
                value={profileForm.nickname}
                onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">성별 <span className="text-gray-400 font-normal">(선택)</span></label>
              <select
                value={profileForm.gender}
                onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">선택 안함</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </div>

            {profileMsg && (
              <p className="text-sm text-green-600">{profileMsg}</p>
            )}

            <button
              onClick={handleProfileSave}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              <Save size={15} /> 저장
            </button>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={18} className="text-gray-600" />
          <h2 className="font-semibold text-gray-900">비밀번호 변경</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
            <input
              type="password"
              value={pwForm.current_password}
              onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 <span className="text-gray-400 font-normal">(6자 이상)</span></label>
            <input
              type="password"
              value={pwForm.new_password}
              onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                pwForm.confirm && pwForm.new_password !== pwForm.confirm ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
          </div>

          {pwError && <p className="text-sm text-red-500">{pwError}</p>}
          {pwMsg && <p className="text-sm text-green-600">{pwMsg}</p>}

          <button
            onClick={handlePasswordChange}
            disabled={!pwForm.current_password || !pwForm.new_password || !pwForm.confirm}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 disabled:opacity-40"
          >
            <Lock size={15} /> 비밀번호 변경
          </button>
        </div>
      </div>
    </div>
  )
}
