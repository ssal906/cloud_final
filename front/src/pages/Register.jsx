import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { authAPI } from '../api'
import useAuthStore from '../store/authStore'

export default function Register() {
  const [form, setForm] = useState({ email: '', nickname: '', password: '', passwordConfirm: '' })
  const [emailChecked, setEmailChecked] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleEmailCheck = async () => {
    if (!form.email) return setEmailMsg('이메일을 입력하세요.')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) return setEmailMsg('올바른 이메일 형식이 아닙니다.')

    try {
      await authAPI.checkEmail(form.email)
      setEmailChecked(true)
      setEmailMsg('사용 가능한 이메일입니다.')
    } catch (err) {
      setEmailChecked(false)
      setEmailMsg(err.response?.data?.detail || '이미 사용 중인 이메일입니다.')
    }
  }

  const handleEmailChange = (e) => {
    setForm({ ...form, email: e.target.value })
    setEmailChecked(false)
    setEmailMsg('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!emailChecked) return setError('이메일 중복 확인을 해주세요.')
    if (!form.nickname.trim()) return setError('닉네임을 입력하세요.')
    if (form.password.length < 6) return setError('비밀번호는 6자 이상이어야 합니다.')
    if (form.password !== form.passwordConfirm) return setError('비밀번호가 일치하지 않습니다.')

    setIsLoading(true)
    try {
      const res = await authAPI.register({
        email: form.email,
        password: form.password,
        nickname: form.nickname,
      })
      setAuth(res.data.user, res.data.access_token)
      navigate('/ledger')
    } catch (err) {
      setError(err.response?.data?.detail || '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 mb-4">
            <span className="text-2xl font-bold text-white">L</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Life Manager</h1>
          <p className="mt-1 text-sm text-gray-500">자기관리 통합 플랫폼</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">회원가입</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={form.email}
                  onChange={handleEmailChange}
                  placeholder="example@email.com"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={handleEmailCheck}
                  className="px-4 py-2.5 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 whitespace-nowrap font-medium"
                >
                  중복확인
                </button>
              </div>
              {emailMsg && (
                <p className={`mt-1 text-xs flex items-center gap-1 ${emailChecked ? 'text-green-600' : 'text-red-500'}`}>
                  {emailChecked && <CheckCircle size={12} />}
                  {emailMsg}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="사용할 닉네임"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 <span className="text-gray-400 font-normal">(6자 이상)</span></label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="비밀번호 (6자 이상)"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 재확인</label>
              <input
                type="password"
                value={form.passwordConfirm}
                onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
                placeholder="비밀번호를 다시 입력하세요"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                  form.passwordConfirm && form.password !== form.passwordConfirm
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
              />
              {form.passwordConfirm && form.password !== form.passwordConfirm && (
                <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {isLoading ? '처리 중...' : '회원가입'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
