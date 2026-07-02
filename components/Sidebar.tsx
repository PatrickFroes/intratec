'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppStore, DEFAULT_PERMISSIONS_USER, DEFAULT_PERMISSIONS_ADMIN, UserPermissions } from '@/lib/store'
import {
  Home,
  Store,
  Calendar,
  CheckSquare,
  FileText,
  Users,
  Bell,
  Map,
  BarChart3,
  History,
  X,
  Target
} from 'lucide-react'

const menuItems = [
  { href: '/', label: 'Overview', icon: Home },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/crm', label: 'CRM / Leads', icon: Target },
  // { href: '/admin/ura', label: 'Bot / URA', icon: Bot }, // Removido temporariamente
  { href: '/planta-baixa', label: 'Planta Baixa', icon: Map },
  { href: '/lojas', label: 'Lojas', icon: Store },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
  { href: '/tarefas', label: 'Tarefas', icon: CheckSquare },
  { href: '/cadastros', label: 'Cadastros', icon: FileText },
  { href: '/corretores', label: 'Corretores', icon: Users },
  { href: '/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/auditoria', label: 'Auditoria', icon: History },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { currentUser, isSidebarOpen, closeSidebar } = useAppStore()

  const permissions = currentUser?.permissions || 
    (currentUser?.role === 'admin' ? DEFAULT_PERMISSIONS_ADMIN : DEFAULT_PERMISSIONS_USER);

  const permissionMap: Record<string, keyof UserPermissions> = {
    '/': 'overview',
    '/relatorios': 'relatorios',
    '/crm': 'crm',
    '/admin/ura': 'cadastros',
    '/planta-baixa': 'plantaBaixa',
    '/lojas': 'lojas',
    '/calendario': 'calendario',
    '/tarefas': 'tarefas',
    '/cadastros': 'cadastros',
    '/corretores': 'corretores',
    '/notificacoes': 'notificacoes',
    '/auditoria': 'auditoria',
  }

  const filteredItems = menuItems.filter(item => {
    const key = permissionMap[item.href]
    if (!key) return true
    
    // Safety check for permissions not yet added to user object (during migration)
    const permission = permissions[key] || 'none'
    return permission !== 'none'
  })

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-300 flex flex-col h-full shadow-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 pb-6 flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-3">
            {/* Logo substitution */}
            <div className="flex items-center justify-center bg-white rounded-xl p-1 shadow-lg shadow-blue-500/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain rounded-lg" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-white leading-tight">Shopping</h1>
                <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">Intranet</p>
            </div>
          </div>
          
          <button 
            onClick={closeSidebar}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-4 py-2 flex-1 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu Principal</p>
          <nav className="flex-1 space-y-1">
              {filteredItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                  <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => window.innerWidth < 1024 && closeSidebar()}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 translate-x-1'
                      : 'hover:bg-slate-800 hover:text-white hover:translate-x-1'
                  }`}
                  >
                  <Icon size={20} className={`transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                  </Link>
              )
              })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800/50">
          <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
             <p className="text-xs text-slate-400 text-center font-medium">© 2026 Intranet System</p>
             <p className="text-[10px] text-slate-500 text-center mt-1">Versão 1.5.0</p>
          </div>
        </div>
      </aside>
    </>
  )
}
