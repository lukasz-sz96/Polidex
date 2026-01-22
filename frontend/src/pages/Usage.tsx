import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, Zap, MessageSquare, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { usageAPI } from '@/lib/api'
import { cn } from '@/lib/utils'

const ITEMS_PER_PAGE = 20

export function Usage() {
  const [page, setPage] = useState(0)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['usage', page],
    queryFn: () => usageAPI.get(ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    refetchInterval: 30000,
  })

  const formatCost = (cost: number) => {
    if (cost < 0.01) {
      return `$${cost.toFixed(6)}`
    }
    return `$${cost.toFixed(4)}`
  }

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(2)}M`
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}k`
    }
    return tokens.toLocaleString()
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const truncate = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen) + '...'
  }

  const totalPages = data ? Math.ceil(data.total_requests / ITEMS_PER_PAGE) : 0

  const statCards = [
    {
      label: 'Total Spent',
      value: formatCost(data?.total_cost ?? 0),
      icon: DollarSign,
      color: 'emerald',
      subtitle: 'All time',
    },
    {
      label: 'Total Requests',
      value: (data?.total_requests ?? 0).toLocaleString(),
      icon: MessageSquare,
      color: 'amber',
      subtitle: 'Queries processed',
    },
    {
      label: 'Total Tokens',
      value: formatTokens((data?.total_prompt_tokens ?? 0) + (data?.total_completion_tokens ?? 0)),
      icon: Zap,
      color: 'sky',
      subtitle: `${formatTokens(data?.total_prompt_tokens ?? 0)} in / ${formatTokens(data?.total_completion_tokens ?? 0)} out`,
    },
  ]

  return (
    <div className="space-y-8">
      <header className="animate-in">
        <h1 className="font-display text-4xl italic text-slate-100 mb-2">
          Usage & <span className="text-gradient">Billing</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Monitor your API usage and costs
        </p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel rounded-2xl p-6 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card, i) => (
            <div
              key={card.label}
              className={cn(
                'glass-panel rounded-2xl p-6 hover-lift animate-in',
                `stagger-${i + 1}`
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    card.color === 'emerald' && 'bg-emerald-500/10 text-emerald-400',
                    card.color === 'amber' && 'bg-amber-500/10 text-amber-400',
                    card.color === 'sky' && 'bg-sky-500/10 text-sky-400'
                  )}
                >
                  <card.icon size={24} />
                </div>
              </div>
              <p className="text-3xl font-semibold text-slate-100 mb-1">
                {card.value}
              </p>
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="text-xs text-slate-600 mt-1">{card.subtitle}</p>
            </div>
          ))}
        </div>
      )}

      <section className="glass-panel rounded-2xl animate-in stagger-4 overflow-hidden">
        <div className="p-6 border-b border-slate-800/50">
          <h2 className="font-display text-2xl italic text-slate-100">
            Request History
          </h2>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-slate-800/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data?.logs.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No requests yet</p>
            <p className="text-sm text-slate-600 mt-1">Usage will appear here once you start making queries</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800/50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Time</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Question</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Response</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Model</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Tokens</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {data?.logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                      className="hover:bg-slate-800/20 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-400">{formatTime(log.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className={cn(
                            'text-sm text-slate-200 transition-all',
                            expandedRow === log.id ? 'whitespace-pre-wrap' : 'truncate'
                          )}>
                            {expandedRow === log.id ? log.query_text : truncate(log.query_text, 50)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className={cn(
                            'text-sm text-slate-400 transition-all',
                            expandedRow === log.id ? 'whitespace-pre-wrap' : 'truncate'
                          )}>
                            {expandedRow === log.id ? log.response_text : truncate(log.response_text, 50)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-800/50 text-xs text-slate-300 font-mono">
                          {log.model_used.split('/').pop()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 text-sm">
                          <span className="flex items-center gap-1 text-sky-400">
                            <ArrowUpRight size={12} />
                            {log.prompt_tokens}
                          </span>
                          <span className="text-slate-600">/</span>
                          <span className="flex items-center gap-1 text-emerald-400">
                            <ArrowDownLeft size={12} />
                            {log.completion_tokens}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-slate-200">
                          {formatCost(log.cost)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/50">
                <p className="text-sm text-slate-500">
                  Showing {page * ITEMS_PER_PAGE + 1} to {Math.min((page + 1) * ITEMS_PER_PAGE, data?.total_requests ?? 0)} of {data?.total_requests ?? 0}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm text-slate-400 px-3">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
