import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Key, Trash2, Copy, Check, AlertCircle, Layers } from 'lucide-react'
import { apiKeysAPI, spacesAPI } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import type { APIKey, Space } from '@/types/api'

export function ApiKeys() {
  const [showCreate, setShowCreate] = useState(false)
  const [newKey, setNewKey] = useState({ name: '', space_id: 0 })
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [filterSpace, setFilterSpace] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data: spaces } = useQuery({
    queryKey: ['spaces'],
    queryFn: spacesAPI.list,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['api-keys', filterSpace],
    queryFn: () => apiKeysAPI.list(filterSpace ?? undefined),
  })

  const createMutation = useMutation({
    mutationFn: apiKeysAPI.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
      setCreatedKey(response.key)
      setNewKey({ name: '', space_id: 0 })
    },
  })

  const revokeMutation = useMutation({
    mutationFn: apiKeysAPI.revoke,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: apiKeysAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (newKey.name.trim() && newKey.space_id > 0) {
      createMutation.mutate(newKey)
    }
  }

  const handleCopyKey = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const closeKeyModal = () => {
    setCreatedKey(null)
    setShowCreate(false)
    setCopied(false)
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between animate-in">
        <div>
          <h1 className="font-display text-4xl italic text-slate-100 mb-2">API Keys</h1>
          <p className="text-slate-400">Manage access keys for external chatbots</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-medium transition-all hover-lift"
        >
          <Plus size={18} />
          New API Key
        </button>
      </header>

      {createdKey && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in">
          <div className="glass-panel rounded-2xl p-8 max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Check size={24} />
              </div>
              <div>
                <h2 className="font-display text-xl italic text-slate-100">Key Created</h2>
                <p className="text-sm text-slate-500">Save this key now — it won't be shown again</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">Your API Key</label>
              <div className="flex gap-2">
                <code className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-amber-400 font-mono text-sm overflow-x-auto">
                  {createdKey}
                </code>
                <button
                  onClick={handleCopyKey}
                  className={cn(
                    'px-4 py-3 rounded-xl transition-all flex items-center gap-2',
                    copied
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  )}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-400 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="text-amber-400 font-medium mb-1">Important</p>
                  <p className="text-slate-400 leading-relaxed">
                    This is the only time you'll see this key. Copy it and store it securely.
                    If you lose it, you'll need to create a new one.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={closeKeyModal}
              className="w-full px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {showCreate && !createdKey && (
        <div className="glass-panel rounded-2xl p-6 animate-in">
          <h2 className="font-display text-xl italic text-slate-100 mb-4">Create API Key</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Key Name</label>
              <input
                type="text"
                value={newKey.name}
                onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                placeholder="e.g., Production Chatbot"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Space</label>
              <select
                value={newKey.space_id}
                onChange={(e) => setNewKey({ ...newKey, space_id: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              >
                <option value={0} disabled>
                  Select a space...
                </option>
                {spaces?.spaces.map((space: Space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
              {spaces?.spaces.length === 0 && (
                <p className="text-sm text-slate-500 mt-2">No spaces available. Create one first.</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending || !newKey.name.trim() || newKey.space_id === 0}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Key'}
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

      <div className="flex items-center gap-4 animate-in stagger-1">
        <span className="text-sm text-slate-500">Filter by space:</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterSpace(null)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm transition-all',
              filterSpace === null
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            )}
          >
            All
          </button>
          {spaces?.spaces.map((space: Space) => (
            <button
              key={space.id}
              onClick={() => setFilterSpace(space.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-all',
                filterSpace === space.id
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
              )}
            >
              {space.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel rounded-xl p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : data?.api_keys.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center animate-in stagger-2">
          <Key size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">No API keys yet</h3>
          <p className="text-slate-500 mb-6">Create keys to allow chatbots to query your knowledge base</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-medium transition-all"
          >
            <Plus size={18} />
            Create API Key
          </button>
        </div>
      ) : (
        <div className="space-y-3 animate-in stagger-2">
          {data?.api_keys.map((apiKey: APIKey) => (
            <ApiKeyRow
              key={apiKey.id}
              apiKey={apiKey}
              onRevoke={() => revokeMutation.mutate(apiKey.id)}
              onDelete={() => deleteMutation.mutate(apiKey.id)}
              isRevoking={revokeMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ApiKeyRow({
  apiKey,
  onRevoke,
  onDelete,
  isRevoking,
  isDeleting,
}: {
  apiKey: APIKey
  onRevoke: () => void
  onDelete: () => void
  isRevoking: boolean
  isDeleting: boolean
}) {
  return (
    <div className="glass-panel rounded-xl p-4 flex items-center justify-between hover-lift">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            apiKey.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800/50 text-slate-500'
          )}
        >
          <Key size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-slate-200 font-medium">{apiKey.name}</p>
            {!apiKey.is_active && (
              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs rounded-full">Revoked</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <code className="text-slate-400">{apiKey.key_prefix}...</code>
            <span>•</span>
            <span>{apiKey.request_count} requests</span>
            <span>•</span>
            <span>{formatDate(apiKey.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-400">
          <Layers size={12} />
          {apiKey.space_name}
        </span>

        <div className="flex items-center gap-1">
          {apiKey.is_active && (
            <button
              onClick={onRevoke}
              disabled={isRevoking}
              className="px-3 py-2 text-amber-400 hover:bg-amber-500/10 rounded-lg text-sm transition-all disabled:opacity-50"
            >
              Revoke
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
