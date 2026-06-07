import { useState, useEffect } from 'react'
import { Plus, Trash2, Timer, Square, CheckSquare2, ChevronLeft, ChevronRight, Calendar, Lock } from 'lucide-react'
import { todoAPI } from '../api'
import { ConfirmModal } from '../components/common/Modal'
import { format, addDays, subDays, getDaysInMonth, startOfMonth, isToday, isBefore, startOfDay } from 'date-fns'
import { ko } from 'date-fns/locale'

function Stopwatch() {
  const [running, setRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [mode, setMode] = useState('stopwatch')
  const [timerInput, setTimerInput] = useState(25)
  const [timerTotal, setTimerTotal] = useState(0)

  useEffect(() => {
    let interval
    if (running) {
      interval = setInterval(() => {
        setTime((t) => {
          if (mode === 'timer') {
            if (t <= 0) { setRunning(false); return 0 }
            return t - 1
          }
          return t + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [running, mode])

  const fmtTime = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const pad = (n) => String(n).padStart(2, '0')
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
  }

  const handleStart = () => {
    if (mode === 'timer' && !running && time === 0) {
      const secs = timerInput * 60
      setTime(secs)
      setTimerTotal(secs)
    }
    setRunning(!running)
  }

  const handleReset = () => { setRunning(false); setTime(0) }
  const progress = mode === 'timer' && timerTotal > 0 ? ((timerTotal - time) / timerTotal) * 100 : 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-5">
      <div className="flex items-center gap-3 mb-4">
        <Timer size={18} className="text-indigo-600" />
        <h2 className="font-semibold text-gray-900">타이머 / 스톱워치</h2>
      </div>
      <div className="flex gap-2 mb-4">
        {['stopwatch', 'timer'].map((m) => (
          <button key={m} onClick={() => { setMode(m); handleReset() }}
            className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${mode === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {m === 'stopwatch' ? '스톱워치' : '타이머'}
          </button>
        ))}
      </div>
      {mode === 'timer' && !running && time === 0 && (
        <div className="flex items-center gap-2 mb-3">
          <input type="number" min={1} max={999} value={timerInput}
            onChange={(e) => setTimerInput(Number(e.target.value))}
            className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center" />
          <span className="text-sm text-gray-500">분</span>
        </div>
      )}
      {mode === 'timer' && timerTotal > 0 && (
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
          <div className="bg-indigo-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="text-4xl font-mono font-bold text-center text-gray-900 my-3">{fmtTime(time)}</div>
      <div className="flex gap-2">
        <button onClick={handleStart}
          className={`flex-1 py-2 text-sm font-medium rounded-lg ${running ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
          {running ? '일시정지' : '시작'}
        </button>
        <button onClick={handleReset} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
          초기화
        </button>
      </div>
    </div>
  )
}

function StatsHeatmap({ stats }) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = getDaysInMonth(new Date(year, month))
  const firstDay = startOfMonth(new Date(year, month)).getDay()
  const statsMap = {}
  stats.forEach((s) => { statsMap[s.date] = s })

  const getColor = (rate) => {
    if (rate === undefined) return 'bg-gray-100 text-gray-300'
    if (rate >= 80) return 'bg-indigo-600 text-white'
    if (rate >= 60) return 'bg-indigo-400 text-white'
    if (rate >= 40) return 'bg-indigo-300 text-indigo-900'
    if (rate >= 20) return 'bg-indigo-200 text-indigo-900'
    return 'bg-indigo-100 text-indigo-800'
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-5">
      <h2 className="font-semibold text-gray-900 mb-3">{year}년 {month + 1}월 완료율</h2>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const stat = statsMap[dateStr]
          const isCurrentDay = dateStr === format(today, 'yyyy-MM-dd')
          return (
            <div key={day}
              className={`aspect-square rounded flex items-center justify-center text-xs font-medium ${stat ? getColor(stat.rate) : 'bg-gray-50 text-gray-300'} ${isCurrentDay ? 'ring-2 ring-indigo-600 ring-offset-1' : ''}`}
              title={stat ? `완료율: ${stat.rate}% (${stat.completed}/${stat.total})` : ''}>
              {day}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
        <span>낮음</span>
        {['bg-indigo-100', 'bg-indigo-200', 'bg-indigo-300', 'bg-indigo-400', 'bg-indigo-600'].map((c) => (
          <div key={c} className={`w-4 h-4 rounded ${c}`} />
        ))}
        <span>높음</span>
      </div>
    </div>
  )
}

export default function Todo() {
  const [todos, setTodos] = useState([])
  const [stats, setStats] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [input, setInput] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editId, setEditId] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  const today = new Date()
  const minDate = subDays(startOfDay(today), 7)  // 최대 7일 전까지만 조회 가능
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')

  // 과거 날짜 여부 (오늘 기준 이전 = 수정 불가)
  const isPast = isBefore(startOfDay(selectedDate), startOfDay(today))
  const isSelectedToday = isToday(selectedDate)
  const canGoBack = isBefore(minDate, startOfDay(selectedDate))

  useEffect(() => {
    todoAPI.cleanup().catch(() => {})
  }, [])

  const fetchData = async () => {
    try {
      const [todosRes, statsRes] = await Promise.all([
        todoAPI.list({ due_date: selectedDateStr }),
        todoAPI.getStats(),
      ])
      setTodos(todosRes.data)
      setStats(statsRes.data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchData() }, [selectedDate])

  // 날짜 변경 시 입력 초기화
  useEffect(() => { setInput('') }, [selectedDate])

  const handleAdd = async () => {
    if (!input.trim() || isPast) return
    try {
      await todoAPI.create({ title: input.trim(), due_date: selectedDateStr })
      setInput('')
      fetchData()
    } catch (e) { console.error(e) }
  }

  const handleToggle = async (id) => {
    if (isPast) return
    try { await todoAPI.toggle(id); fetchData() } catch (e) { console.error(e) }
  }

  const handleDelete = async (id) => {
    try { await todoAPI.delete(id); fetchData() } catch (e) { console.error(e) }
  }

  const handleSaveEdit = async (id) => {
    if (!editTitle.trim()) return
    try { await todoAPI.update(id, { title: editTitle }); setEditId(null); fetchData() } catch (e) { console.error(e) }
  }

  // 날짜 스트립: 7일 전 ~ 14일 후 (총 22일)
  const stripDates = Array.from({ length: 22 }, (_, i) => addDays(minDate, i))

  const pending = todos.filter((t) => !t.is_completed)
  const done = todos.filter((t) => t.is_completed)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">투두리스트</h1>
        <p className="text-sm text-gray-500 mt-0.5">날짜를 선택해서 할 일을 관리하세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">

          {/* Date Strip */}
          <div className="bg-white rounded-2xl shadow-sm border p-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedDate(d => subDays(d, 1))}
                disabled={!canGoBack}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 flex-shrink-0"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex-1 flex gap-1 overflow-x-auto py-1 scrollbar-hide">
                {stripDates.map((d) => {
                  const dStr = format(d, 'yyyy-MM-dd')
                  const isSelected = dStr === selectedDateStr
                  const isT = isToday(d)
                  const isPastDate = isBefore(startOfDay(d), startOfDay(today))

                  return (
                    <button
                      key={dStr}
                      onClick={() => setSelectedDate(d)}
                      className={`flex-shrink-0 flex flex-col items-center px-2.5 py-2 rounded-xl text-xs transition-colors min-w-[44px] ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : isT
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : isPastDate
                          ? 'text-gray-400 hover:bg-gray-50'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">{format(d, 'EEE', { locale: ko })}</span>
                      <span className="text-sm font-bold">{format(d, 'd')}</span>
                      {isT && <span className="text-[9px] font-semibold">오늘</span>}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setSelectedDate(d => addDays(d, 1))}
                className="p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="mt-2 pt-2 border-t text-center">
              <span className="text-sm font-semibold text-gray-800">
                {format(selectedDate, 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
              </span>
              {isSelectedToday && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">오늘</span>
              )}
              {isPast && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full">읽기 전용</span>
              )}
            </div>
          </div>

          {/* 과거 날짜 안내 배너 */}
          {isPast && (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <Lock size={15} />
              <span>과거 날짜는 읽기 전용입니다. 할 일을 추가하거나 수정할 수 없습니다.</span>
            </div>
          )}

          {/* 추가 입력 (오늘 이후만 표시) */}
          {!isPast && (
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder={`${format(selectedDate, 'M월 d일')}${isSelectedToday ? ' (오늘)' : ''} 할 일 입력`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  autoFocus
                />
                <button
                  onClick={handleAdd}
                  disabled={!input.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 완료 현황 */}
          {todos.length > 0 && (
            <div className="flex gap-2 text-sm flex-wrap">
              <span className="px-3 py-1 bg-white border rounded-full text-gray-600">전체 {todos.length}</span>
              <span className="px-3 py-1 bg-white border rounded-full text-orange-500">미완료 {pending.length}</span>
              <span className="px-3 py-1 bg-white border rounded-full text-green-600">완료 {done.length}</span>
              {todos.length > 0 && (
                <span className="px-3 py-1 bg-white border rounded-full text-indigo-600">
                  완료율 {Math.round(done.length / todos.length * 100)}%
                </span>
              )}
            </div>
          )}

          {/* Todo List */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            {todos.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                <p>이 날 할 일이 없습니다.</p>
                {!isPast && <p className="text-xs mt-1">위에서 할 일을 추가해보세요!</p>}
              </div>
            ) : (
              <div className="divide-y">
                {todos.map((todo) => (
                  <div key={todo.id} className={`flex items-center gap-3 p-4 ${!isPast ? 'hover:bg-gray-50' : ''}`}>

                    {/* 체크박스: 과거면 비활성 */}
                    <button
                      onClick={() => !isPast && handleToggle(todo.id)}
                      disabled={isPast}
                      className={`flex-shrink-0 ${
                        todo.is_completed
                          ? 'text-indigo-600'
                          : isPast
                          ? 'text-gray-200 cursor-not-allowed'
                          : 'text-gray-300 hover:text-indigo-400'
                      }`}
                    >
                      {todo.is_completed ? <CheckSquare2 size={20} /> : <Square size={20} />}
                    </button>

                    {/* 제목 */}
                    <div className="flex-1 min-w-0">
                      {editId === todo.id ? (
                        <div className="flex gap-2">
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(todo.id)
                              if (e.key === 'Escape') setEditId(null)
                            }}
                            className="flex-1 px-2 py-1 border border-indigo-300 rounded-lg text-sm focus:outline-none"
                            autoFocus
                          />
                          <button onClick={() => handleSaveEdit(todo.id)} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-lg">저장</button>
                          <button onClick={() => setEditId(null)} className="px-2 py-1 text-xs border border-gray-300 rounded-lg">취소</button>
                        </div>
                      ) : (
                        <span
                          className={`text-sm ${
                            todo.is_completed
                              ? 'line-through text-gray-400'
                              : isPast
                              ? 'text-gray-600'
                              : 'text-gray-900 cursor-pointer'
                          }`}
                          onDoubleClick={() => {
                            if (!isPast) { setEditId(todo.id); setEditTitle(todo.title) }
                          }}
                          title={!isPast ? '더블클릭하여 수정' : undefined}
                        >
                          {todo.title}
                        </span>
                      )}
                    </div>

                    {/* 삭제: 과거면 숨김 */}
                    {!isPast && (
                      <button
                        onClick={() => setDeleteTarget(todo)}
                        className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 우측 패널 */}
        <div className="space-y-4">
          <StatsHeatmap stats={stats} />
          <Stopwatch />
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?.id)}
        title="할 일 삭제"
        message={`"${deleteTarget?.title}"을 삭제하시겠습니까?`}
      />
    </div>
  )
}
