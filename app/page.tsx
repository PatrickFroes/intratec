'use client'

import { useAppStore } from '@/lib/store'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Building2,
  Store,
  Users,
  TrendingUp,
  Map,
  CheckSquare,
  Megaphone,
  Plus,
  Trash2
} from 'lucide-react'
import { MobileDashboard } from './components/MobileDashboard'

export default function Home() {
  const { 
    properties, stores, notifications, currentUser, tasks, 
    fetchProperties, fetchStores, fetchTasks, fetchNotifications,
    addNotification, removeNotification, loadRecents, recentPropertyIds
  } = useAppStore()

  useEffect(() => {
    // Ensure fresh data on dashboard load
    fetchProperties()
    fetchStores()
    fetchTasks()
    fetchNotifications()
    loadRecents()
  }, [fetchProperties, fetchStores, fetchTasks, fetchNotifications, loadRecents])

  const [showNoticeForm, setShowNoticeForm] = useState(false)
  const [noticeData, setNoticeData] = useState({ title: '', message: '' })

  const isAdmin = currentUser?.role === 'admin'

  // Filtered Data for Readers
  const myStores = stores.filter(s => {
      if (isAdmin) return true
      return s.agentId === currentUser?.id
  })

  const myProperties = properties.filter(p => {
      if (isAdmin) return true
      const hasMyStore = myStores.some(s => s.propertyId === p.id)
      const isPinnedOnMap = p.agentMarkers?.some(m => m.agentId === currentUser?.id)
      return hasMyStore || isPinnedOnMap
  })

  // Real Stats Calculations
  const relevantProperties = isAdmin ? properties : myProperties
  const relevantStores = isAdmin ? stores : myStores

  // Sort by Recents
  const recentProps = recentPropertyIds
    .map(id => relevantProperties.find(p => p.id === id))
    .filter((p): p is typeof properties[0] => !!p)

  const otherProps = relevantProperties.filter(p => !recentPropertyIds.includes(p.id))
  const displayProperties = [...recentProps, ...otherProps]

  // Occupancy Rate: Should reflect the ACTUAL occupancy of the visible properties, not just "my" stores.
  // We need to count ALL stores that belong to the relevant properties.
  const allStoresInMyProperties = stores.filter(s => relevantProperties.some(p => p.id === s.propertyId))

  const totalCapacity = relevantProperties.reduce((acc, p) => acc + (Number(p.capacity) || 0), 0)
  // Fix: Use all active stores in these properties, not just the agent's stores
  const occupancyRate = totalCapacity > 0 ? ((allStoresInMyProperties.length / totalCapacity) * 100).toFixed(1) : '0.0'
  
  const myPendingTasks = tasks.filter(t => t.userIds?.includes(currentUser?.id || '') && t.status === 'pending').length
  const globalNotices = notifications.filter(n => n.userId === 'global')

  const handleAddNotice = (e: React.FormEvent) => {
      e.preventDefault()
      if (noticeData.title && noticeData.message) {
          addNotification({
              userId: 'global',
              title: noticeData.title,
              message: noticeData.message,
              type: 'info',
              read: false
          })
          setNoticeData({ title: '', message: '' })
          setShowNoticeForm(false)
      }
  }

  const handleDeleteNotice = (id: string) => {
      if (window.confirm('Excluir este aviso geral?')) {
          removeNotification(id)
      }
  }

  const stats = [
    {
      label: 'Empreendimentos',
      value: relevantProperties.length,
      icon: Building2,
      color: 'blue',
      link: '/cadastros?tab=properties',
      desc: isAdmin ? 'Total cadastrado' : 'Meus Empreendimentos'
    },
    {
      label: 'Lojas Ativas',
      value: relevantStores.length,
      icon: Store,
      color: 'emerald',
      link: '/lojas',
      desc: isAdmin ? 'Em operação' : 'Minhas Lojas'
    },
    {
      label: 'Minhas Tarefas',
      value: myPendingTasks,
      icon: CheckSquare,
      color: 'amber',
      link: '/tarefas',
      desc: 'Pendentes'
    },
     {
      label: 'Taxa de Ocupação',
      value: `${occupancyRate}%`,
      icon: TrendingUp,
      color: 'violet',
      link: '/cadastros?tab=stores', // Link to stores or maybe a report page if existed
      desc: isAdmin ? 'Média global' : 'Minhas Propriedades'
    },
  ]

  const getColorClasses = (color: string) => {
    switch(color) {
        case 'blue': return 'bg-blue-50 text-blue-600 ring-blue-600/20';
        case 'emerald': return 'bg-emerald-50 text-emerald-600 ring-emerald-600/20';
        case 'amber': return 'bg-amber-50 text-amber-600 ring-amber-600/20';
        case 'violet': return 'bg-violet-50 text-violet-600 ring-violet-600/20';
        default: return 'bg-gray-50 text-gray-600 ring-gray-600/20';
    }
  }

  return (
    <>
      <div className="lg:hidden">
        <MobileDashboard />
      </div>

      <div className="hidden lg:block page-container space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
            <h1 className="heading-1">Dashboard</h1>
            <p className="text-slate-500 mt-2 text-lg">Visão geral do tráfego e performance dos shoppings.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          const colorClass = getColorClasses(stat.color)
          
          return (
            <Link href={stat.link} key={stat.label} className="card relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 block">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ring-1 ${colorClass}`}>
                  <Icon size={22} strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-2">
                 <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stat.color === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {stat.desc}
                 </span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Empreendimentos - Main Content (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
            <h2 className="heading-2">Meus Empreendimentos</h2>
            <Link
                href="/cadastros?tab=properties"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
                Ver todos <ArrowRight size={16} />
            </Link>
            </div>

            <div className="grid grid-cols-1 gap-4">
            {displayProperties.slice(0, 5).map((property, idx) => (
                <Link href={`/empreendimentos?id=${property.id}`} key={property.id} className="block">
                <div className="card flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-200 transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl transition-colors ${recentPropertyIds.includes(property.id) ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                            {idx + 1}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-slate-900 text-lg">{property.name}</h3>
                                {recentPropertyIds.includes(property.id) && (
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Recente</span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                <span className="flex items-center gap-1"><Map size={14} /> {property.city}</span>
                                <span className="hidden md:inline text-slate-300">•</span>
                                <span className="flex items-center gap-1"><Users size={14} /> {property.manager}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 pl-16 md:pl-0">
                         <div className="text-right">
                             <p className="text-xs text-slate-400 font-medium uppercase">Lojas</p>
                             <p className="text-lg font-bold text-slate-700">{allStoresInMyProperties.filter(s => s.propertyId === property.id).length || '--'}</p>
                         </div>
                         <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                            <ArrowRight size={20} />
                         </button>
                    </div>
                </div>
                </Link>
            ))}
            
            {displayProperties.length === 0 && (
                <div className="card border-dashed flex flex-col items-center justify-center py-12 bg-slate-50/50">
                    <Building2 size={48} className="text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">Nenhum empreendimento cadastrado</p>
                    <Link href="/cadastros" className="mt-4 btn-primary text-sm">Cadastrar Agora</Link>
                </div>
            )}
            </div>
        </div>

        {/* Quick Actions & Status - Sidebar (1/3 width) */}
        <div className="space-y-6">
             <div className="card bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-none">
                <h3 className="font-semibold text-lg mb-2">Acesso Rápido</h3>
                <p className="text-indigo-200 text-sm mb-6">Atalhos para as funções mais utilizadas no dia a dia.</p>
                
                <div className="space-y-3">
                    <Link href="/cadastros" className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm border border-white/10 group">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 p-2 rounded-md"><Store size={18} className="text-blue-300" /></div>
                            <span className="font-medium text-sm">Gerenciar Lojas</span>
                        </div>
                        <ArrowRight size={16} className="text-indigo-300 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="/tarefas" className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm border border-white/10 group">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-500/20 p-2 rounded-md"><CheckSquare size={18} className="text-emerald-300" /></div>
                            <span className="font-medium text-sm">Minhas Tarefas</span>
                        </div>
                        <ArrowRight size={16} className="text-indigo-300 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
             </div>

             <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Megaphone size={20} className="text-amber-500" />
                        <h3 className="font-semibold text-slate-900">Quadro de Avisos</h3>
                    </div>
                    {isAdmin && (
                        <button 
                            onClick={() => setShowNoticeForm(true)}
                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors flex items-center gap-1"
                        >
                            <Plus size={14} /> Novo
                        </button>
                    )}
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {globalNotices.map((notice) => (
                        <div key={notice.id} className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 relative group">
                            <p className="text-xs text-amber-500 mb-1 font-semibold flex justify-between">
                                {new Date(notice.createdAt).toLocaleDateString()}
                                {isAdmin && (
                                    <button 
                                        onClick={() => handleDeleteNotice(notice.id)}
                                        className="text-amber-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </p>
                            <h4 className="text-sm font-bold text-slate-800 mb-1">{notice.title}</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">{notice.message}</p>
                        </div>
                    ))}
                    {globalNotices.length === 0 && (
                        <p className="text-sm text-slate-400 italic text-center py-4">Nenhum aviso geral no momento.</p>
                    )}
                </div>
             </div>
        </div>

      </div>

      {/* Admin Notice Modal */}
      {showNoticeForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-800">Novo Aviso Geral</h3>
                      <button onClick={() => setShowNoticeForm(false)} className="text-gray-400 hover:text-gray-600">
                          <Plus size={24} className="rotate-45" />
                      </button>
                  </div>
                  <form onSubmit={handleAddNotice} className="p-4 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                          <input 
                              type="text" 
                              className="input-field w-full" 
                              value={noticeData.title}
                              onChange={e => setNoticeData({...noticeData, title: e.target.value})}
                              required
                              placeholder="Ex: Manutenção Programada"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                          <textarea 
                              className="input-field w-full h-32 resize-none" 
                              value={noticeData.message}
                              onChange={e => setNoticeData({...noticeData, message: e.target.value})}
                              required
                              placeholder="Digite a mensagem do aviso..."
                          />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setShowNoticeForm(false)} className="btn-secondary">Cancelar</button>
                          <button type="submit" className="btn-primary">Publicar Aviso</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
    </>
  )
}
