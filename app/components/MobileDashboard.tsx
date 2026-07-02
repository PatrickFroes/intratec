'use client'

import { useAppStore } from '@/lib/store'
import Link from 'next/link'
import {
  Building2,
  Store,
  CheckSquare,
  TrendingUp,
  Map,
  ArrowRight
} from 'lucide-react'

export function MobileDashboard() {
  const { 
    properties, stores, tasks, currentUser, notifications 
  } = useAppStore()

  const isAdmin = currentUser?.role === 'admin'
  
  const myStores = stores.filter(s => {
      if (isAdmin) return true
      return s.agentId === currentUser?.id
  })

  // Relevant Data
  const filteredProperties = properties.filter(p => {
    if (isAdmin) return true
    const hasMyStore = myStores.some(s => s.propertyId === p.id)
    const isPinnedOnMap = p.agentMarkers?.some(m => m.agentId === currentUser?.id)
    return hasMyStore || isPinnedOnMap
  })

  const myPendingTasks = tasks.filter(t => t.userIds?.includes(currentUser?.id || '') && t.status === 'pending').length
  const recentNotices = notifications
    .filter(n => n.userId === 'global' || n.userId === currentUser?.id)
    .slice(0, 3)

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Mobile Mobile Header - Fixed */}
      <div className="bg-blue-600 text-white px-5 pt-12 pb-6 rounded-b-[2rem] shadow-lg sticky top-0 z-10">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-blue-100 text-sm font-medium">Bem vindo,</p>
                <h1 className="text-2xl font-bold">{currentUser?.name.split(' ')[0]}</h1>
            </div>
            <div className="bg-blue-500/30 p-2 rounded-full backdrop-blur-sm">
                <Store size={24} />
            </div>
        </div>

        {/* Quick Stats Scroll View */}
        <div className="flex gap-3 mt-6 overflow-x-auto pb-2 no-scrollbar snap-x">
             <div className="flex-none w-32 bg-white/10 backdrop-blur-md rounded-xl p-3 snap-start border border-white/10">
                <div className="text-blue-100 text-xs mb-1">Taxa Ocup.</div>
                <div className="text-2xl font-bold flex items-center gap-1">
                    95% <TrendingUp size={14} />
                </div>
             </div>
             
             <div className="flex-none w-32 bg-white/10 backdrop-blur-md rounded-xl p-3 snap-start border border-white/10">
                <div className="text-blue-100 text-xs mb-1">Tarefas</div>
                <div className="text-2xl font-bold flex items-center gap-1">
                    {myPendingTasks} <CheckSquare size={14} />
                </div>
             </div>

             <div className="flex-none w-32 bg-white/10 backdrop-blur-md rounded-xl p-3 snap-start border border-white/10">
                <div className="text-blue-100 text-xs mb-1">Lojas</div>
                <div className="text-2xl font-bold flex items-center gap-1">
                    {myStores.length} <Store size={14} />
                </div>
             </div>
        </div>
      </div>

      {/* Main Content Actions */}
      <div className="px-4 -mt-2 space-y-4">
        
        {/* Quick Action Grid */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 grid grid-cols-4 gap-4">
            <Link href="/cadastros" className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                    <Building2 size={22} />
                </div>
                <span className="text-[10px] font-medium text-slate-600">Emp.</span>
            </Link>
            <Link href="/lojas" className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                    <Store size={22} />
                </div>
                <span className="text-[10px] font-medium text-slate-600">Lojas</span>
            </Link>
             <Link href="/planta-baixa" className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
                    <Map size={22} />
                </div>
                <span className="text-[10px] font-medium text-slate-600">Mapa</span>
            </Link>
             <Link href="/tarefas" className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                    <CheckSquare size={22} />
                </div>
                <span className="text-[10px] font-medium text-slate-600">Tarefas</span>
            </Link>
        </div>

        {/* Empreendimentos Section */}
        <div>
            <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="font-bold text-slate-800">Meus Empreendimentos</h3>
                <Link href="/cadastros?tab=properties" className="text-xs text-blue-600 font-medium">Ver todos</Link>
            </div>
            
            <div className="space-y-3">
                {filteredProperties.slice(0, 3).map(prop => (
                    <Link href={`/empreendimentos?id=${prop.id}`} key={prop.id} className="block bg-white p-3 rounded-xl shadow-sm border border-slate-100 active:scale-[0.98] transition-transform">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-500">
                                {prop.name.substring(0, 1)}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-800 text-sm">{prop.name}</h4>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Map size={10} /> {prop.city}
                                </p>
                            </div>
                            <ArrowRight size={16} className="text-slate-300" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>

        {/* Notices Section */}
        {recentNotices.length > 0 && (
             <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <h3 className="font-bold text-amber-800 text-sm mb-3">Avisos Recentes</h3>
                <div className="space-y-3">
                    {recentNotices.map((n) => (
                        <div key={n.id} className="flex gap-3 bg-white/50 p-2 rounded-lg">
                            <div className="w-1 h-8 bg-amber-400 rounded-full"></div>
                            <div>
                                <p className="text-xs font-bold text-slate-800">{n.title}</p>
                                <p className="text-[10px] text-slate-600 line-clamp-2">{n.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  )
}
