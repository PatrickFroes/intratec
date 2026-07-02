'use client'

import { useAppStore, UserPermissions, DEFAULT_PERMISSIONS_USER, DEFAULT_PERMISSIONS_ADMIN } from '@/lib/store'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, 
  CheckSquare, 
  Bell, 
  Map, 
  Menu
} from 'lucide-react'

export default function MobileTabBar() {
  const pathname = usePathname()
  const { toggleSidebar, currentUser } = useAppStore()

  const permissions = currentUser?.permissions || 
    (currentUser?.role === 'admin' ? DEFAULT_PERMISSIONS_ADMIN : DEFAULT_PERMISSIONS_USER);

  const isActive = (path: string) => pathname === path

  // Helper para verificar permissão
  const hasAccess = (permissionKey: keyof UserPermissions) => {
    return (permissions[permissionKey] || 'none') !== 'none'
  }

  // Definição das Tabs
  const tabs = [
    {
      label: 'Início',
      href: '/',
      icon: Home,
      alwaysShow: true
    },
    {
      label: 'Tarefas',
      href: '/tarefas',
      icon: CheckSquare,
      permissionKey: 'tarefas' as keyof UserPermissions
    },
    {
      label: 'Mapa',
      href: '/planta-baixa',
      icon: Map,
      permissionKey: 'plantaBaixa' as keyof UserPermissions
    },
    {
      label: 'Notif.',
      href: '/notificacoes',
      icon: Bell,
      permissionKey: 'notificacoes' as keyof UserPermissions
    }
  ]

  // Filtra as tabs baseadas na permissão
  const visibleTabs = tabs.filter(t => t.alwaysShow || (t.permissionKey && hasAccess(t.permissionKey)))

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)] z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16">
        
        {/* Renderiza as Tabs Dinâmicas */}
        {visibleTabs.map((tab) => {
          const active = isActive(tab.href)
          const Icon = tab.icon
          
          return (
            <Link 
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={24} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}

        {/* Botão de Menu (Sempre Visível) */}
        <button
          onClick={toggleSidebar}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-500 hover:text-slate-800"
        >
          <Menu size={24} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>

      </div>
    </div>
  )
}
