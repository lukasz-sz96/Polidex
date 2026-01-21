import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, FileText, Key, Layers } from 'lucide-react'
import { spacesAPI } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import type { Space } from '@/types/api'

export function Spaces() {
  const [showCreate, setShowCreate] = useState(false)
  const [newSpace, setNewSpace] = useState({ name: '', description: '' })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: spacesAPI.list,
  })

  const createMutation = useMutation({
    mutationFn: spacesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
      setShowCreate(false)
      setNewSpace({ name: '', description: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: spacesAPI.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spaces'] }),
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSpace.name.trim()) {
      createMutation.mutate(newSpace)
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between animate-in">
        <div>
          <h1 className="font-display text-4xl italic text-slate-100 mb-2">Spaces</h1>
          <p className="text-slate-400">Organize your documents into queryable collections</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-medium transition-all hover-lift"
        >
          <Plus size={18} />
          New Space
        </button>
      </header>

      {showCreate && (
        <div className="glass-panel rounded-2xl p-6 animate-in">
          <h2 className="font-display text-xl italic text-slate-100 mb-4">Create New Space</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Name</label>
              <input
                type="text"
                value={newSpace.name}
                onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                placeholder="e.g., Customer Support KB"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Description (optional)</label>
              <textarea
                value={newSpace.description}
                onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                placeholder="Describe what this space is for..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Space'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel rounded-2xl p-6 animate-pulse h-48" />
          ))}
        </div>
      ) : data?.spaces.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center animate-in">
          <Layers size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">No spaces yet</h3>
          <p className="text-slate-500 mb-6">Create your first space to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-medium transition-all"
          >
            <Plus size={18} />
            Create Space
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.spaces.map((space: Space, i: number) => (
            <SpaceCard
              key={space.id}
              space={space}
              onDelete={() => deleteMutation.mutate(space.id)}
              isDeleting={deleteMutation.isPending}
              delay={i + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SpaceCard({
  space,
  onDelete,
  isDeleting,
  delay,
}: {
  space: Space
  onDelete: () => void
  isDeleting: boolean
  delay: number
}) {
  const { data: detail } = useQuery({
    queryKey: ['space', space.id],
    queryFn: () => spacesAPI.get(space.id),
  })

  return (
    <div className={cn('glass-panel rounded-2xl p-6 hover-lift animate-in', `stagger-${delay}`)}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <Layers size={24} />
        </div>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <h3 className="text-lg font-medium text-slate-100 mb-1">{space.name}</h3>
      {space.description && (
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{space.description}</p>
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-slate-800/50">
        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <FileText size={14} />
          <span>{detail?.document_count ?? 0} docs</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <Key size={14} />
          <span>{detail?.api_key_count ?? 0} keys</span>
        </div>
      </div>

      <p className="text-xs text-slate-600 mt-3">{formatDate(space.created_at)}</p>
    </div>
  )
}
