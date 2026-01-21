import { NavLink, Outlet } from 'react-router-dom'
import { FileText, MessageSquare, Key, LayoutDashboard, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/spaces', icon: Layers, label: 'Spaces' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/chat', icon: MessageSquare, label: 'Test Chat' },
  { to: '/api-keys', icon: Key, label: 'API Keys' },
]

export function Layout() {
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

        <div className="p-4 border-t border-slate-800/50">
          <div className="glass-panel rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-2">Quick Tip</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload documents to a space, then use API keys to query them from your chatbots.
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64">
        <div className="p-8 min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
