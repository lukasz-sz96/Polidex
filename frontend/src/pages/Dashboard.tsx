import { useQuery } from '@tanstack/react-query'
import { FileText, Layers, MessageSquare, Clock, Zap } from 'lucide-react'
import { statsAPI } from '@/lib/api'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: statsAPI.overview,
    refetchInterval: 30000,
  })

  const statCards = [
    {
      label: 'Total Spaces',
      value: stats?.total_spaces ?? 0,
      icon: Layers,
      color: 'amber',
      delay: 1,
    },
    {
      label: 'Documents',
      value: stats?.total_documents ?? 0,
      icon: FileText,
      color: 'emerald',
      delay: 2,
    },
    {
      label: 'Total Chunks',
      value: stats?.total_chunks ?? 0,
      icon: Zap,
      color: 'sky',
      delay: 3,
    },
    {
      label: 'Queries Made',
      value: stats?.total_queries ?? 0,
      icon: MessageSquare,
      color: 'purple',
      delay: 4,
    },
  ]

  const metricCards = [
    {
      label: 'Avg Latency',
      value: `${stats?.avg_latency_ms?.toFixed(0) ?? 0}ms`,
      icon: Clock,
      description: 'Response time',
    },
    {
      label: 'Avg Chunks Retrieved',
      value: stats?.avg_chunks_retrieved?.toFixed(1) ?? '0',
      icon: FileText,
      description: 'Per query',
    },
  ]

  return (
    <div className="space-y-8">
      <header className="animate-in">
        <h1 className="font-display text-4xl italic text-slate-100 mb-2">
          Welcome to <span className="text-gradient">Polidex</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Your RAG knowledge base management system
        </p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel rounded-2xl p-6 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={cn(
                'glass-panel rounded-2xl p-6 hover-lift animate-in',
                `stagger-${card.delay}`
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    card.color === 'amber' && 'bg-amber-500/10 text-amber-400',
                    card.color === 'emerald' && 'bg-emerald-500/10 text-emerald-400',
                    card.color === 'sky' && 'bg-sky-500/10 text-sky-400',
                    card.color === 'purple' && 'bg-purple-500/10 text-purple-400'
                  )}
                >
                  <card.icon size={24} />
                </div>
              </div>
              <p className="text-3xl font-semibold text-slate-100 mb-1">
                {card.value.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metricCards.map((card, i) => (
          <div
            key={card.label}
            className={cn('glass-panel rounded-2xl p-6 animate-in', `stagger-${i + 5}`)}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400">
                <card.icon size={28} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-100">{card.value}</p>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="text-xs text-slate-600">{card.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="glass-panel rounded-2xl p-8 animate-in stagger-5">
        <h2 className="font-display text-2xl italic text-slate-100 mb-6">
          Getting Started
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-display text-xl italic">
              1
            </div>
            <h3 className="font-medium text-slate-200">Create a Space</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Spaces organize your documents. Each chatbot can query a specific space.
            </p>
          </div>
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-display text-xl italic">
              2
            </div>
            <h3 className="font-medium text-slate-200">Upload Documents</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Add PDFs, Word docs, or text files. They'll be chunked and embedded automatically.
            </p>
          </div>
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-display text-xl italic">
              3
            </div>
            <h3 className="font-medium text-slate-200">Generate API Keys</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Create keys for your chatbots to query the knowledge base securely.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
