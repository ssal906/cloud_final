import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Trash2, MessageSquare } from 'lucide-react'
import { chatAPI } from '../api'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState([])
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    chatAPI.getHistory()
      .then((res) => {
        const hist = res.data.reverse()
        setHistory(hist)
        const msgs = hist.flatMap((h) => [
          { role: 'user', content: h.user_message, time: h.created_at },
          { role: 'assistant', content: h.ai_response, time: h.created_at },
        ])
        setMessages(msgs)
      })
      .catch(console.error)
  }, [])

  useEffect(() => { scrollToBottom() }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg, time: new Date().toISOString() }])
    setIsLoading(true)

    try {
      const res = await chatAPI.send(userMsg)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.ai_response, time: res.data.created_at }
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.', time: new Date().toISOString() }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const SUGGESTIONS = [
    '오늘 할 투두리스트가 몇 개 있지?',
    '이번 달 총 지출이 얼마야?',
    '오늘 일정이 있어?',
    '등록된 서류 목록을 알려줘',
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">AI 챗봇</h1>
            <p className="text-xs text-gray-500">가계부, 투두리스트, 일정, 서류 데이터를 알고 있습니다</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-4">
              <MessageSquare size={32} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">무엇이든 물어보세요</h2>
            <p className="text-sm text-gray-500 mb-6">AI가 당신의 데이터를 기반으로 답변합니다</p>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-left px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <Bot size={16} className="text-indigo-600" />
              </div>
            )}
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.time && (
                <span className="text-xs text-gray-300 px-1">
                  {format(new Date(msg.time), 'HH:mm', { locale: ko })}
                </span>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                <User size={16} className="text-gray-500" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <Bot size={16} className="text-indigo-600" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-6 py-4">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="메시지를 입력하세요 (Enter로 전송)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          AI는 메모 내용은 접근하지 않습니다
        </p>
      </div>
    </div>
  )
}
