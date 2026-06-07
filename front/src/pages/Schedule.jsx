import { useState, useEffect } from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import moment from 'moment'
import 'moment/locale/ko'
import { getDaysInMonth, startOfMonth } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { scheduleAPI } from '../api'
import Modal, { ConfirmModal } from '../components/common/Modal'

moment.locale('ko')
const localizer = momentLocalizer(moment)

const COLORS = ['#4F46E5', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#BE185D']

const emptyForm = {
  title: '', description: '', color: '#4F46E5',
  start_datetime: '', end_datetime: '', all_day: false,
}

const fmtLocal = (d) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// IME 버그 방지: ScheduleForm을 Schedule 컴포넌트 밖에 정의
function ScheduleForm({ form, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
        <input
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          placeholder="일정 제목"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
        <textarea
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="일정 설명 (선택)"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="all_day_chk"
          checked={form.all_day}
          onChange={(e) => onChange({ ...form, all_day: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="all_day_chk" className="text-sm text-gray-600">하루 종일</label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시작 *</label>
          <input
            type={form.all_day ? 'date' : 'datetime-local'}
            value={form.all_day ? form.start_datetime.slice(0, 10) : form.start_datetime}
            onChange={(e) => onChange({ ...form, start_datetime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">종료 *</label>
          <input
            type={form.all_day ? 'date' : 'datetime-local'}
            value={form.all_day ? form.end_datetime.slice(0, 10) : form.end_datetime}
            onChange={(e) => onChange({ ...form, end_datetime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">색상</label>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button key={c} type="button"
              onClick={() => onChange({ ...form, color: c })}
              className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Schedule() {
  const [events, setEvents] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState(Views.MONTH)

  const fetchEvents = async () => {
    try {
      const res = await scheduleAPI.list()
      setEvents(res.data.map((s) => ({
        ...s,
        start: new Date(s.start_datetime),
        end: new Date(s.end_datetime),
        allDay: s.all_day,
        resource: s,
      })))
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchEvents() }, [])

  const handleSelectSlot = ({ start, end }) => {
    setForm({ ...emptyForm, start_datetime: fmtLocal(start), end_datetime: fmtLocal(end) })
    setShowAdd(true)
  }

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.resource)
    setForm({
      title: event.resource.title,
      description: event.resource.description || '',
      color: event.resource.color,
      start_datetime: fmtLocal(new Date(event.resource.start_datetime)),
      end_datetime: fmtLocal(new Date(event.resource.end_datetime)),
      all_day: event.resource.all_day,
    })
    setShowEdit(true)
  }

  const handleCreate = async () => {
    if (!form.title.trim() || !form.start_datetime || !form.end_datetime) return
    try {
      await scheduleAPI.create({
        ...form,
        start_datetime: new Date(form.start_datetime).toISOString(),
        end_datetime: new Date(form.end_datetime).toISOString(),
      })
      setShowAdd(false)
      setForm(emptyForm)
      fetchEvents()
    } catch (e) { console.error(e) }
  }

  const handleUpdate = async () => {
    if (!form.title.trim() || !selectedEvent) return
    try {
      await scheduleAPI.update(selectedEvent.id, {
        ...form,
        start_datetime: new Date(form.start_datetime).toISOString(),
        end_datetime: new Date(form.end_datetime).toISOString(),
      })
      setShowEdit(false)
      fetchEvents()
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id) => {
    try {
      await scheduleAPI.delete(id)
      setShowEdit(false)
      fetchEvents()
    } catch (e) { console.error(e) }
  }

  // 목록(Agenda) 뷰 전환 시 해당 달 1일로 이동
  const handleViewChange = (view) => {
    setCalendarView(view)
    if (view === Views.AGENDA) {
      setCalendarDate(startOfMonth(calendarDate))
    }
  }

  const handleNavigate = (date) => {
    setCalendarDate(date)
  }

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.color || '#4F46E5',
      borderRadius: '4px',
      border: 'none',
      color: 'white',
      fontSize: '12px',
    }
  })

  // 목록 뷰에서 달의 전체 일수만큼 표시
  const agendaLength = getDaysInMonth(calendarDate)

  return (
    <div className="p-6 flex flex-col" style={{ height: '100vh' }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">일정 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">캘린더를 클릭하거나 드래그해서 일정을 추가하세요</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setShowAdd(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
          <Plus size={16} /> 일정 추가
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ minHeight: 0 }}>
        <div className="p-4 h-full">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView={Views.MONTH}
            view={calendarView}
            date={calendarDate}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            length={agendaLength}
            style={{ height: '100%' }}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            eventPropGetter={eventStyleGetter}
            formats={{
              agendaDateFormat: 'YYYY년 MM월 DD일',
              agendaTimeFormat: 'HH:mm',
              agendaHeaderFormat: ({ start, end }) =>
                `${moment(start).format('YYYY년 MM월 DD일')} ~ ${moment(end).format('YYYY년 MM월 DD일')}`,
              dayFormat: 'D일 (ddd)',
              monthHeaderFormat: 'YYYY년 MM월',
              dayHeaderFormat: 'YYYY년 MM월 DD일 (ddd)',
              weekHeaderFormat: ({ start, end }) =>
                `${moment(start).format('MM월 DD일')} ~ ${moment(end).format('MM월 DD일')}`,
            }}
            messages={{
              today: '오늘',
              previous: '◀',
              next: '▶',
              month: '월',
              week: '주',
              day: '일',
              agenda: '목록',
              noEventsInRange: '이 기간에 일정이 없습니다.',
              showMore: (total) => `+${total}개 더보기`,
              date: '날짜',
              time: '시간',
              event: '일정',
            }}
          />
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="일정 추가">
        <ScheduleForm form={form} onChange={setForm} />
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg">취소</button>
          <button onClick={handleCreate} disabled={!form.title.trim()}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg disabled:opacity-40">추가</button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="일정 수정">
        <ScheduleForm form={form} onChange={setForm} />
        <div className="flex justify-between mt-5">
          <button onClick={() => setDeleteTarget(selectedEvent)}
            className="flex items-center gap-1 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg">
            <Trash2 size={14} /> 삭제
          </button>
          <div className="flex gap-2">
            <button onClick={() => setShowEdit(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg">취소</button>
            <button onClick={handleUpdate} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg">저장</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?.id)}
        title="일정 삭제" message={`"${deleteTarget?.title}" 일정을 삭제하시겠습니까?`} />
    </div>
  )
}
