import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Maximize2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { chatAPI } from '../../api'

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setIsLoading(true)

    try {
      const res = await chatAPI.send(userMsg)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.ai_response }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '오류가 발생했습니다. 다시 시도해주세요.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen && (
        <div className="mb-3 w-80 rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: '400px' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} />
              <span className="text-sm font-semibold">AI 어시스턴트</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setIsOpen(false); navigate('/chat') }}
                className="p-1 hover:bg-indigo-500 rounded"
                title="전체 화면"
              >
                <Maximize2 size={14} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-indigo-500 rounded">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-xs mt-8">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                <p>무엇이든 물어보세요!</p>
                <p className="mt-1">오늘 할 일, 지출 현황 등</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="메시지 입력..."
              className="flex-1 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </button>
    </div>
  )
}
