import { useState, useEffect, useRef } from 'react'
import { Plus, FolderPlus, Folder, FileText, Trash2 } from 'lucide-react'
import { memoAPI } from '../api'
import { ConfirmModal } from '../components/common/Modal'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function Memo() {
  const [folders, setFolders] = useState([])
  const [memos, setMemos] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedMemo, setSelectedMemo] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState({ title: '', content: '' })
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [deleteFolder, setDeleteFolder] = useState(null)
  const [deleteMemo, setDeleteMemo] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [dragOverFolder, setDragOverFolder] = useState(null) // folder id or 'root'

  const fetchAll = async () => {
    try {
      const [foldersRes, memosRes] = await Promise.all([
        memoAPI.listFolders(),
        memoAPI.list(selectedFolder),
      ])
      setFolders(foldersRes.data)
      setMemos(memosRes.data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchAll() }, [selectedFolder])

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await memoAPI.createFolder({ name: newFolderName })
      setNewFolderName('')
      setShowNewFolder(false)
      fetchAll()
    } catch (e) { console.error(e) }
  }

  const handleDeleteFolder = async (id) => {
    try {
      await memoAPI.deleteFolder(id)
      if (selectedFolder === id) setSelectedFolder(null)
      fetchAll()
    } catch (e) { console.error(e) }
  }

  const handleNewMemo = async () => {
    try {
      const res = await memoAPI.create({ title: '새 메모', content: '', folder_id: selectedFolder })
      await fetchAll()
      setSelectedMemo(res.data)
      setEditContent({ title: res.data.title, content: res.data.content || '', folder_id: res.data.folder_id })
      setIsEditing(true)
    } catch (e) { console.error(e) }
  }

  const handleSelectMemo = (memo) => {
    if (isEditing && selectedMemo) handleSave()
    setSelectedMemo(memo)
    setEditContent({ title: memo.title, content: memo.content || '', folder_id: memo.folder_id })
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!selectedMemo) return
    setIsSaving(true)
    try {
      const res = await memoAPI.update(selectedMemo.id, editContent)
      setSelectedMemo(res.data)
      setIsEditing(false)
      fetchAll()
    } catch (e) { console.error(e) }
    finally { setIsSaving(false) }
  }

  const handleDeleteMemo = async (id) => {
    try {
      await memoAPI.delete(id)
      if (selectedMemo?.id === id) { setSelectedMemo(null); setIsEditing(false) }
      fetchAll()
    } catch (e) { console.error(e) }
  }

  // ── Drag and Drop ──
  const handleDragStart = (e, memo) => {
    e.dataTransfer.setData('memoId', String(memo.id))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, targetKey) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverFolder(targetKey)
  }

  const handleDragLeave = () => setDragOverFolder(null)

  const handleDrop = async (e, targetFolderId) => {
    e.preventDefault()
    setDragOverFolder(null)
    const memoId = parseInt(e.dataTransfer.getData('memoId'))
    if (!memoId) return
    try {
      await memoAPI.update(memoId, { folder_id: targetFolderId })
      fetchAll()
      if (selectedMemo?.id === memoId) {
        setSelectedMemo(prev => prev ? { ...prev, folder_id: targetFolderId } : prev)
      }
    } catch (e) { console.error(e) }
  }

  const dropZoneClass = (key) =>
    dragOverFolder === key
      ? 'ring-2 ring-indigo-400 bg-indigo-50'
      : ''

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel */}
      <div className="w-64 bg-white border-r flex flex-col">
        {/* Folders */}
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">폴더</span>
            <button onClick={() => setShowNewFolder(true)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
              <FolderPlus size={14} />
            </button>
          </div>

          {showNewFolder && (
            <div className="flex gap-1 mb-2">
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false) }}
                placeholder="폴더명"
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none"
                autoFocus
              />
              <button onClick={handleCreateFolder} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded">추가</button>
            </div>
          )}

          {/* 전체 (root drop zone) */}
          <div
            onDragOver={(e) => handleDragOver(e, 'root')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
            className={`rounded-lg transition-all ${dropZoneClass('root')}`}
          >
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${
                selectedFolder === null ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText size={14} /> 전체
            </button>
          </div>

          {folders.map((folder) => (
            <div
              key={folder.id}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder.id)}
              className={`group flex items-center rounded-lg transition-all ${dropZoneClass(folder.id)}`}
            >
              <button
                onClick={() => setSelectedFolder(folder.id)}
                className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${
                  selectedFolder === folder.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Folder size={14} />
                <span className="truncate">{folder.name}</span>
              </button>
              <button
                onClick={() => setDeleteFolder(folder)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 rounded"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Memo List */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">메모</span>
            <button onClick={handleNewMemo} className="p-1 hover:bg-gray-100 rounded text-gray-400">
              <Plus size={14} />
            </button>
          </div>
          {memos.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">메모가 없습니다</p>
          ) : (
            <div className="space-y-1">
              {memos.map((memo) => (
                <div
                  key={memo.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, memo)}
                  className="group relative cursor-grab active:cursor-grabbing"
                >
                  <button
                    onClick={() => handleSelectMemo(memo)}
                    className={`w-full text-left px-2 py-2 rounded-lg ${
                      selectedMemo?.id === memo.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{memo.title}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{memo.content || '내용 없음'}</p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      {formatDistanceToNow(new Date(memo.updated_at), { addSuffix: true, locale: ko })}
                    </p>
                  </button>
                  <button
                    onClick={() => setDeleteMemo(memo)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 rounded"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t">
          <button
            onClick={handleNewMemo}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
          >
            <Plus size={14} /> 새 메모
          </button>
        </div>
      </div>

      {/* Right Panel: Editor */}
      <div className="flex-1 flex flex-col">
        {selectedMemo ? (
          <>
            <div className="bg-white border-b px-6 py-3 space-y-2">
              {/* 제목 행 */}
              <div className="flex items-center justify-between">
                {isEditing ? (
                  <input
                    value={editContent.title}
                    onChange={(e) => setEditContent({ ...editContent, title: e.target.value })}
                    className="text-lg font-semibold text-gray-900 bg-transparent border-b-2 border-indigo-400 focus:outline-none flex-1 mr-4"
                  />
                ) : (
                  <h2 className="text-lg font-semibold text-gray-900">{selectedMemo.title}</h2>
                )}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(selectedMemo.updated_at), { addSuffix: true, locale: ko })}
                  </span>
                  {isEditing ? (
                    <>
                      <button onClick={handleSave} disabled={isSaving}
                        className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                        {isSaving ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={() => { setIsEditing(false); setEditContent({ title: selectedMemo.title, content: selectedMemo.content || '', folder_id: selectedMemo.folder_id }) }}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                        취소
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50">
                      편집
                    </button>
                  )}
                </div>
              </div>

              {/* 폴더 선택 행 */}
              <div className="flex items-center gap-2">
                <Folder size={13} className="text-gray-400 flex-shrink-0" />
                {isEditing ? (
                  <select
                    value={editContent.folder_id ?? ''}
                    onChange={(e) => setEditContent({ ...editContent, folder_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="text-xs text-gray-600 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white"
                  >
                    <option value="">폴더 없음</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-gray-400">
                    {folders.find(f => f.id === selectedMemo.folder_id)?.name || '폴더 없음'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 p-6 overflow-auto">
              {isEditing ? (
                <textarea
                  value={editContent.content}
                  onChange={(e) => setEditContent({ ...editContent, content: e.target.value })}
                  placeholder="메모를 작성하세요..."
                  className="w-full h-full resize-none focus:outline-none text-gray-700 text-sm leading-relaxed bg-transparent"
                  style={{ minHeight: '400px' }}
                />
              ) : (
                <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                  {selectedMemo.content || <span className="text-gray-300">내용이 없습니다. 편집을 눌러 작성하세요.</span>}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">메모를 선택하거나 새 메모를 작성하세요</p>
              <p className="text-xs mt-1 text-gray-300">메모를 드래그해서 폴더로 이동할 수 있습니다</p>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteFolder}
        onClose={() => setDeleteFolder(null)}
        onConfirm={() => handleDeleteFolder(deleteFolder?.id)}
        title="폴더 삭제"
        message={`"${deleteFolder?.name}" 폴더를 삭제하시겠습니까? 폴더 내 메모는 전체 보기로 이동합니다.`}
      />
      <ConfirmModal
        isOpen={!!deleteMemo}
        onClose={() => setDeleteMemo(null)}
        onConfirm={() => handleDeleteMemo(deleteMemo?.id)}
        title="메모 삭제"
        message={`"${deleteMemo?.title}" 메모를 삭제하시겠습니까?`}
      />
    </div>
  )
}
