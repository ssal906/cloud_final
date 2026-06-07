import { useState, useEffect } from 'react'
import { Plus, Trash2, Download, Eye, ExternalLink, FileText, File, X } from 'lucide-react'
import { documentAPI, API_BASE } from '../api'
import Modal, { ConfirmModal } from '../components/common/Modal'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

const DOC_TYPES = ['이력서', '자기소개서', '포트폴리오', '기획서', '보고서', '계약서', '기타']

// 서버 UTC 시간을 올바르게 파싱 (KST 오프셋 보정)
const parseUTC = (dateStr) => {
  if (!dateStr) return new Date()
  return new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
}

const downloadFile = async (doc) => {
  const token = localStorage.getItem('token')
  const res = await fetch(documentAPI.downloadUrl(doc.id), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('파일을 다운로드할 수 없습니다.')

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = doc.file_name || doc.title || 'download'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function FileViewer({ doc, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [htmlContent, setHtmlContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const ext = doc.file_name?.split('.').pop()?.toLowerCase() || ''
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
  const isPdf = ext === 'pdf'
  const isText = ['txt', 'md', 'csv'].includes(ext)
  const isOfficeHtml = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ext)
  // 미리보기 자체가 불가한 형식
  const isUnsupported = !isImage && !isPdf && !isText && !isOfficeHtml

  useEffect(() => {
    if (isUnsupported) {
      setLoading(false)
      return
    }
    let objectUrl = null

    const load = async () => {
      try {
        if (isOfficeHtml) {
          const token = localStorage.getItem('token')
          const res = await fetch(`${API_BASE}/documents/${doc.id}/html-preview`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (!res.ok) {
            const msg = await res.text()
            throw new Error(msg)
          }
          const html = await res.text()
          setHtmlContent(html)
        } else {
          const blob = await documentAPI.fetchBlob(doc.id)
          objectUrl = URL.createObjectURL(blob)
          setBlobUrl(objectUrl)
        }
      } catch (e) {
        setError(e.message || '파일을 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [doc.id])

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl flex flex-col shadow-2xl" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0">
          <h2 className="font-semibold text-gray-900 truncate">{doc.title}</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => downloadFile(doc)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 px-3 py-1.5 border rounded-lg">
              <Download size={13} /> 다운로드
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0 bg-gray-50 flex items-center justify-center">
          {loading && <div className="text-gray-400 text-sm p-8">파일 불러오는 중...</div>}

          {/* 이미지 */}
          {blobUrl && isImage && (
            <img src={blobUrl} alt={doc.title} className="max-w-full max-h-full object-contain p-4 rounded-lg" />
          )}

          {/* PDF */}
          {blobUrl && isPdf && (
            <iframe src={blobUrl} className="w-full border-0" style={{ height: '75vh' }} title={doc.title} />
          )}

          {/* 텍스트 */}
          {blobUrl && isText && <TextViewer url={blobUrl} />}

          {/* DOCX / XLSX - HTML 렌더링 */}
          {htmlContent && (
            <iframe
              srcDoc={htmlContent}
              className="w-full border-0"
              style={{ height: '75vh' }}
              title={doc.title}
              sandbox="allow-scripts"
            />
          )}

          {/* 보기 불가 형식 (HWP 등) */}
          {!loading && isUnsupported && (
            <div className="text-center text-gray-500 p-10">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
                <File size={32} className="text-gray-400" />
              </div>
              <p className="font-semibold text-gray-700 mb-1">미리보기를 지원하지 않는 파일입니다</p>
              <p className="text-xs text-gray-400 mb-1">{ext.toUpperCase()} 형식</p>
              <p className="text-xs text-gray-400 mb-5">
                지원 형식: PDF, 이미지, TXT, DOCX, XLSX, PPTX
              </p>
              <button onClick={() => downloadFile(doc)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                <Download size={14} /> 파일 다운로드
              </button>
            </div>
          )}

          {/* 변환 오류 */}
          {!loading && error && (
            <div className="text-center p-10">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 mb-4">
                <File size={32} className="text-red-400" />
              </div>
              <p className="font-semibold text-gray-700 mb-1">미리보기를 불러올 수 없습니다</p>
              <p className="text-xs text-red-400 mb-5">{error}</p>
              <button onClick={() => downloadFile(doc)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                <Download size={14} /> 파일 다운로드
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TextViewer({ url }) {
  const [text, setText] = useState('')
  useEffect(() => {
    fetch(url).then(r => r.text()).then(setText).catch(() => setText('파일을 읽을 수 없습니다.'))
  }, [url])
  return (
    <pre className="w-full overflow-auto text-sm text-gray-700 bg-white p-6 whitespace-pre-wrap" style={{ height: '75vh' }}>
      {text}
    </pre>
  )
}

export default function Documents() {
  const [docs, setDocs] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewDoc, setViewDoc] = useState(null)
  const [form, setForm] = useState({ title: '', doc_type: '이력서', notion_url: '' })
  const [file, setFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchDocs = async () => {
    try {
      const res = await documentAPI.list()
      setDocs(res.data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchDocs() }, [])

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setIsLoading(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('doc_type', form.doc_type)
      if (form.notion_url) fd.append('notion_url', form.notion_url)
      if (file) fd.append('file', file)
      await documentAPI.create(fd)
      setShowAdd(false)
      setForm({ title: '', doc_type: '이력서', notion_url: '' })
      setFile(null)
      fetchDocs()
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const handleDelete = async (id) => {
    try { await documentAPI.delete(id); fetchDocs() } catch (e) { console.error(e) }
  }

  const getFileIcon = (fileName) => {
    if (!fileName) return <File size={20} className="text-gray-400" />
    const ext = fileName.split('.').pop().toLowerCase()
    const map = {
      pdf: 'text-red-500', docx: 'text-blue-500', doc: 'text-blue-500',
      xlsx: 'text-green-500', xls: 'text-green-500', hwp: 'text-teal-500',
    }
    return <FileText size={20} className={map[ext] || 'text-gray-400'} />
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">서류 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">중요 문서를 한 곳에서 관리하세요</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
          <Plus size={16} /> 서류 추가
        </button>
      </div>

      {docs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border py-16 text-center text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">등록된 서류가 없습니다.</p>
          <p className="text-xs mt-1">이력서, 자기소개서 등 중요 문서를 추가하세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getFileIcon(doc.file_name)}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{doc.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{doc.doc_type}</span>
                      {doc.file_size && <span className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setDeleteTarget(doc)}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(parseUTC(doc.updated_at), { addSuffix: true, locale: ko })} 업데이트
                </span>
                <div className="flex gap-2">
                  {doc.notion_url && (
                    <a href={doc.notion_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded-lg">
                      <ExternalLink size={12} /> Notion
                    </a>
                  )}
                  {doc.file_name && (
                    <>
                      <button onClick={() => setViewDoc(doc)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 px-2 py-1 border border-gray-200 rounded-lg">
                        <Eye size={12} /> 보기
                      </button>
                      <button onClick={() => downloadFile(doc)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 px-2 py-1 border border-gray-200 rounded-lg">
                        <Download size={12} /> 다운로드
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="서류 추가" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="서류 제목"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
            <select value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">노션 URL</label>
            <input value={form.notion_url} onChange={(e) => setForm({ ...form, notion_url: e.target.value })}
              placeholder="https://notion.so/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">파일 첨부</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.hwp,.pptx,.ppt,.png,.jpg,.jpeg,.gif,.webp"
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" />
            {file && <p className="mt-1 text-xs text-gray-500">{file.name}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
            <button onClick={handleCreate} disabled={!form.title.trim() || isLoading}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40">
              {isLoading ? '업로드 중...' : '추가'}
            </button>
          </div>
        </div>
      </Modal>

      {viewDoc && <FileViewer doc={viewDoc} onClose={() => setViewDoc(null)} />}

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?.id)}
        title="서류 삭제" message={`"${deleteTarget?.title}" 서류를 삭제하시겠습니까?`} />
    </div>
  )
}
