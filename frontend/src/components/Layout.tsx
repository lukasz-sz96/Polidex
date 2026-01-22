import { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { FileText, MessageSquare, Key, LayoutDashboard, Layers, LogOut, Lock, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAdminToken, setAdminToken, clearAdminToken } from '@/lib/api'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/spaces', icon: Layers, label: 'Spaces' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/chat', icon: MessageSquare, label: 'Test Chat' },
  { to: '/api-keys', icon: Key, label: 'API Keys' },
  { to: '/usage', icon: Activity, label: 'Usage' },
]

export function Layout() {
  const [token, setToken] = useState<string | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [inputToken, setInputToken] = useState('')

  useEffect(() => {
    setToken(getAdminToken())
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputToken.trim()) {
      setAdminToken(inputToken.trim())
      setToken(inputToken.trim())
      setInputToken('')
      setShowLogin(false)
    }
  }

  const handleLogout = () => {
    clearAdminToken()
    setToken(null)
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 glass-panel border-r border-slate-800/50 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-800/50">
          <h1 className="font-display text-2xl italic text-gradient">Polidex</h1>
          <p className="text-xs text-slate-500 mt-1 tracking-wide uppercase">RAG Admin</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  'hover:bg-slate-800/50 group',
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                )
              }
            >
              <item.icon
                size={18}
                className="transition-transform group-hover:scale-110"
              />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/50 space-y-3">
          {token ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all text-sm"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all text-sm border border-amber-500/20"
            >
              <Lock size={16} />
              <span>Enter Admin Token</span>
            </button>
          )}
        </div>
      </aside>

      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in">
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="font-display text-xl italic text-slate-100 mb-4">Admin Authentication</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Admin Token</label>
                <input
                  type="password"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="Enter your admin token"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-medium transition-all"
                >
                  Authenticate
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="flex-1 ml-64">
        <div className="p-8 min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
