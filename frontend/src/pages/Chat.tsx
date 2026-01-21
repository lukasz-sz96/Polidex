import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { Send, Bot, User, FileText, Loader2 } from 'lucide-react'
import { chatAPI, spacesAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Space, ChatResponse } from '@/types/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: ChatResponse['sources']
}

export function Chat() {
  const [selectedSpace, setSelectedSpace] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: spaces } = useQuery({
    queryKey: ['spaces'],
    queryFn: spacesAPI.list,
  })

  const chatMutation = useMutation({
    mutationFn: chatAPI.query,
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer, sources: data.sources },
      ])
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selectedSpace || chatMutation.isPending) return

    setMessages((prev) => [...prev, { role: 'user', content: input }])
    chatMutation.mutate({ query: input, space_id: selectedSpace })
    setInput('')
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <header className="mb-6 animate-in">
        <h1 className="font-display text-4xl italic text-slate-100 mb-2">Test Chat</h1>
        <p className="text-slate-400">Query your knowledge base to test RAG responses</p>
      </header>

      <div className="flex items-center gap-4 mb-6 animate-in stagger-1">
        <span className="text-sm text-slate-500">Select space:</span>
        <div className="flex flex-wrap gap-2">
          {spaces?.spaces.map((space: Space) => (
            <button
              key={space.id}
              onClick={() => setSelectedSpace(space.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm transition-all',
                selectedSpace === space.id
                  ? 'bg-amber-500 text-slate-900 font-medium'
                  : 'glass-panel text-slate-400 hover:text-slate-200'
              )}
            >
              {space.name}
            </button>
          ))}
          {spaces?.spaces.length === 0 && (
            <p className="text-sm text-slate-500">No spaces available. Create one first.</p>
          )}
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden animate-in stagger-2">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <Bot size={48} className="mx-auto text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-400 mb-2">
                  Ready to answer your questions
                </h3>
                <p className="text-sm text-slate-500 max-w-md">
                  Select a space and start asking questions about your documents.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, i) => (
              <MessageBubble key={i} message={message} />
            ))
          )}

          {chatMutation.isPending && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                <Bot size={20} />
              </div>
              <div className="glass-panel rounded-2xl rounded-tl-sm px-5 py-4">
                <Loader2 size={20} className="animate-spin text-slate-400" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800/50">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                selectedSpace
                  ? 'Ask a question about your documents...'
                  : 'Select a space first...'
              }
              disabled={!selectedSpace}
              className="flex-1 px-5 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!selectedSpace || !input.trim() || chatMutation.isPending}
              className="px-5 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={18} />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex items-start gap-4', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          isUser ? 'bg-slate-700 text-slate-300' : 'bg-amber-500/10 text-amber-400'
        )}
      >
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>

      <div className={cn('max-w-[70%] space-y-3', isUser && 'text-right')}>
        <div
          className={cn(
            'rounded-2xl px-5 py-4',
            isUser
              ? 'bg-slate-700 text-slate-100 rounded-tr-sm'
              : 'glass-panel text-slate-200 rounded-tl-sm'
          )}
        >
          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-amber-400">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Sources:</p>
            {message.sources.map((source, i) => (
              <div
                key={i}
                className="glass-panel rounded-lg p-3 text-left"
              >
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <FileText size={12} />
                  <span>{source.filename}</span>
                  <span className="text-slate-600">•</span>
                  <span>Score: {(source.score * 100).toFixed(0)}%</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{source.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
