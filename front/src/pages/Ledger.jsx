import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Lock } from 'lucide-react'
import { ledgerAPI } from '../api'
import { ConfirmModal } from '../components/common/Modal'

const NECESSITY_LABEL = { high: '상', medium: '중', low: '하' }
const NECESSITY_COLOR = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
}

const emptyForm = { name: '', price: '', necessity: 'medium', item_date: '' }

export default function Ledger() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [summary, setSummary] = useState(null)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [addForm, setAddForm] = useState(emptyForm)
  const [showAdd, setShowAdd] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await ledgerAPI.getSummary(year, month)
      setSummary(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [year, month])

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (!isCurrentMonth) {
      if (month === 12) { setYear(y => y + 1); setMonth(1) }
      else setMonth(m => m + 1)
    }
  }

  const isFormValid = (f) => f.name.trim() && f.price && f.necessity

  const handleAdd = async () => {
    if (!isFormValid(addForm)) return
    try {
      await ledgerAPI.create({
        name: addForm.name,
        price: parseInt(addForm.price),
        necessity: addForm.necessity,
        item_date: addForm.item_date || null,
      })
      setAddForm(emptyForm)
      setShowAdd(false)
      fetchData()
    } catch (e) { console.error(e) }
  }

  const startEdit = (item) => {
    setEditId(item.id)
    setEditForm({
      name: item.name,
      price: String(item.price),
      necessity: item.necessity,
      item_date: item.item_date || '',
    })
  }

  const handleUpdate = async () => {
    if (!isFormValid(editForm)) return
    try {
      await ledgerAPI.update(editId, {
        name: editForm.name,
        price: parseInt(editForm.price),
        necessity: editForm.necessity,
        item_date: editForm.item_date || null,
      })
      setEditId(null)
      fetchData()
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id) => {
    try {
      await ledgerAPI.delete(id)
      fetchData()
    } catch (e) { console.error(e) }
  }

  const totalDiff = summary ? summary.total - summary.prev_total : 0

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">가계부</h1>
          <p className="text-sm text-gray-500 mt-0.5">지출을 기록하고 관리하세요</p>
        </div>
        {isCurrentMonth && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            <Plus size={16} /> 항목 추가
          </button>
        )}
      </div>

      {/* Month Navigator */}
      <div className="bg-white rounded-2xl shadow-sm border p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{year}년 {month}월</div>
            <div className={`text-2xl font-bold mt-1 ${
              totalDiff > 0 ? 'text-red-500' : totalDiff < 0 ? 'text-green-600' : 'text-gray-900'
            }`}>
              {summary ? `${summary.total.toLocaleString()}원` : '로딩 중...'}
            </div>
            {summary && (
              <div className={`flex items-center justify-center gap-1 text-sm mt-1 ${
                totalDiff > 0 ? 'text-red-500' : totalDiff < 0 ? 'text-green-600' : 'text-gray-400'
              }`}>
                {totalDiff > 0 ? <TrendingUp size={14} /> : totalDiff < 0 ? <TrendingDown size={14} /> : null}
                <span>
                  {totalDiff === 0
                    ? `저번 달과 동일 (${summary.prev_total.toLocaleString()}원)`
                    : `저번 달보다 ${Math.abs(totalDiff).toLocaleString()}원 ${totalDiff > 0 ? '더 지출' : '덜 지출'}`
                  }
                </span>
              </div>
            )}
          </div>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* 과거 달 읽기 전용 배너 */}
        {!isCurrentMonth && (
          <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-600">
            <Lock size={12} />
            <span>과거 내역은 읽기 전용입니다.</span>
          </div>
        )}
      </div>

      {/* Add Form */}
      {showAdd && isCurrentMonth && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-indigo-900 mb-3">새 항목 추가</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="상품명 *"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="number"
              placeholder="가격 (원) *"
              value={addForm.price}
              onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <select
              value={addForm.necessity}
              onChange={(e) => setAddForm({ ...addForm, necessity: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="high">필요성: 상</option>
              <option value="medium">필요성: 중</option>
              <option value="low">필요성: 하</option>
            </select>
            <input
              type="date"
              value={addForm.item_date}
              onChange={(e) => setAddForm({ ...addForm, item_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAdd}
              disabled={!isFormValid(addForm)}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40"
            >
              추가
            </button>
            <button
              onClick={() => { setShowAdd(false); setAddForm(emptyForm) }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-gray-400 text-sm">불러오는 중...</div>
        ) : !summary?.items?.length ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            <p>이번 달 지출 내역이 없습니다.</p>
            {isCurrentMonth && <p className="mt-1 text-xs">위의 항목 추가 버튼을 눌러 지출을 기록하세요.</p>}
          </div>
        ) : (
          <div className="divide-y">
            {summary.items.map((item) => (
              <div key={item.id} className="p-4">
                {editId === item.id ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="col-span-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                    <select
                      value={editForm.necessity}
                      onChange={(e) => setEditForm({ ...editForm, necessity: e.target.value })}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="high">상</option>
                      <option value="medium">중</option>
                      <option value="low">하</option>
                    </select>
                    <input
                      type="date"
                      value={editForm.item_date}
                      onChange={(e) => setEditForm({ ...editForm, item_date: e.target.value })}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                    <div className="col-span-2 flex gap-2 mt-1">
                      <button
                        onClick={handleUpdate}
                        disabled={!isFormValid(editForm)}
                        className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg disabled:opacity-40"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded-lg"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${NECESSITY_COLOR[item.necessity]}`}>
                        {NECESSITY_LABEL[item.necessity]}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        {item.item_date && (
                          <p className="text-xs text-gray-400">{item.item_date}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">{item.price.toLocaleString()}원</span>
                      {isCurrentMonth && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?.id)}
        title="항목 삭제"
        message={`"${deleteTarget?.name}" 항목을 삭제하시겠습니까?`}
      />
    </div>
  )
}
