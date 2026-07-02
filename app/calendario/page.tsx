'use client'

import { useAppStore, DEFAULT_PERMISSIONS_ADMIN, DEFAULT_PERMISSIONS_USER } from '@/lib/store'
import { Plus, ChevronLeft, ChevronRight, Clock, MapPin, User, Trash2, Search } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

export default function Calendario() {
  const { events, users, addEvent, removeEvent, currentUser } = useAppStore()
  const permissions = currentUser?.permissions || (currentUser?.role === 'admin' ? DEFAULT_PERMISSIONS_ADMIN : DEFAULT_PERMISSIONS_USER)
  const canEdit = permissions.calendario === 'editor'
  const [showForm, setShowForm] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [view] = useState<'month' | 'week' | 'day'>('month')
  const [pastSearchTerm, setPastSearchTerm] = useState('')

  useEffect(() => {
    setCurrentDate(new Date())
  }, [])

  // -- FILTER VISIBILITY LOGIC --
  // Admins see all. Users see only events they are participating in or organized.
  const displayedEvents = useMemo(() => {
    return events.filter(e => {
      const isAdmin = currentUser?.role === 'admin'
      if (isAdmin) return true
      
      const isParticipant = e.userIds?.includes(currentUser?.id || '')
      const isOrganizer = e.organizer === currentUser?.name 
      
      return isParticipant || isOrganizer
    })
  }, [events, currentUser])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    organizer: '',
    userIds: [] as string[]
  })

  // Calendar Logic
  const getCalendarCells = () => {
      if (!currentDate) return []
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() // 0-indexed
      const today = new Date()

      if (view === 'month') {
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const firstDayOfMonth = new Date(year, month, 1).getDay() // 0 (Sun) - 6 (Sat)
        const daysInPrevMonth = new Date(year, month, 0).getDate()
        
        const cells = []
        
        // Previous month days padding
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            cells.push({
            date: new Date(year, month - 1, daysInPrevMonth - i),
            isCurrentMonth: false,
            isToday: false
            })
        }
        
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i)
            const isToday = 
            date.getDate() === today.getDate() && 
            date.getMonth() === today.getMonth() && 
            date.getFullYear() === today.getFullYear()
            
            cells.push({
            date,
            isCurrentMonth: true,
            isToday
            })
        }
        
        // Next month days padding (to fill 42 cells grid 6x7)
        const remainingCells = 42 - cells.length
        for (let i = 1; i <= remainingCells; i++) {
            cells.push({
            date: new Date(year, month + 1, i),
            isCurrentMonth: false,
            isToday: false
            })
        }
        return cells
      } else if (view === 'week') {
        const startOfWeek = new Date(currentDate)
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()) // Go to Sunday
        const cells = []
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek)
            d.setDate(startOfWeek.getDate() + i)
            const isToday = 
                d.getDate() === today.getDate() && 
                d.getMonth() === today.getMonth() && 
                d.getFullYear() === today.getFullYear()
            cells.push({
                date: d,
                isCurrentMonth: true,
                isToday
            })
        }
        return cells
      } else { // day
        const isToday = 
            currentDate.getDate() === today.getDate() && 
            currentDate.getMonth() === today.getMonth() && 
            currentDate.getFullYear() === today.getFullYear()
         return [{
             date: new Date(currentDate),
             isCurrentMonth: true,
             isToday
         }]
      }
  }

  if (!currentDate) return <div className="flex h-[50vh] items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
  </div>

  const calendarCells = getCalendarCells()

  const navigateDate = (delta: number) => {
    if (!currentDate) return
    const newDate = new Date(currentDate)
    if (view === 'month') {
        newDate.setMonth(newDate.getMonth() + delta)
    } else if (view === 'week') {
        newDate.setDate(newDate.getDate() + (delta * 7))
    } else if (view === 'day') {
        newDate.setDate(newDate.getDate() + delta)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.userIds.length === 0) {
        alert('Por favor, selecione pelo menos um usuário para receber a notificação do evento.')
        return
    }
    if (formData.title && formData.date && formData.time) {
      addEvent({
        title: formData.title,
        description: formData.description,
        date: new Date(formData.date),
        time: formData.time,
        location: formData.location,
        organizer: formData.organizer,
        userIds: formData.userIds
      })
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        organizer: '',
        userIds: []
      })
      setShowForm(false)
    }
  }

  const toggleUser = (userId: string) => {
    setFormData(prev => {
        const isSelected = prev.userIds.includes(userId)
        if (isSelected) {
            return { ...prev, userIds: prev.userIds.filter(id => id !== userId) }
        } else {
            return { ...prev, userIds: [...prev.userIds, userId] }
        }
    })
  }

  const handleDeleteEvent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
        removeEvent(id)
        if (selectedEvent && selectedEvent.id === id) {
            setSelectedEvent(null)
        }
    }
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const getEventsForDate = (date: Date) => {
      return displayedEvents.filter(e => {
          const eDate = new Date(e.date)
          return eDate.getDate() === date.getDate() &&
                 eDate.getMonth() === date.getMonth() &&
                 eDate.getFullYear() === date.getFullYear()
      })
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 gap-6 min-h-screen">
      
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-slate-800">Calendário</h1>
         {canEdit && (
         <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={18} /> Novo Evento
        </button>
        )}
      </div>

     <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">Navegação</h3>
                    <button onClick={goToToday} className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 bg-blue-50 rounded">
                        Hoje
                    </button>
                </div>
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg mb-4">
                    <button onClick={() => navigateDate(-1)} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all">
                        <ChevronLeft size={20} className="text-slate-500" />
                    </button>
                    <span className="font-medium text-slate-700">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button onClick={() => navigateDate(1)} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all">
                        <ChevronRight size={20} className="text-slate-500" />
                    </button>
                </div>
                {/* View Selector could go here */}
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-blue-600"/> Próximos Eventos
                </h3>
                <div className="space-y-3">
                    {displayedEvents
                      .filter(e => {
                          const eDate = new Date(e.date);
                          eDate.setHours(0,0,0,0);
                          const today = new Date();
                          today.setHours(0,0,0,0);
                          return eDate >= today;
                      })
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .slice(0, 5)
                      .map(event => (
                          <div key={event.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer" onClick={() => setSelectedEvent(event)}>
                              <p className="text-xs font-bold text-blue-600 mb-1">{new Date(event.date).toLocaleDateString()} - {event.time}</p>
                              <h4 className="font-medium text-slate-800 text-sm">{event.title}</h4>
                              {event.location && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin size={12}/>{event.location}</p>}
                          </div>
                      ))
                    }
                    {displayedEvents.filter(e => new Date(e.date) >= new Date()).length === 0 && (
                        <p className="text-sm text-slate-400 italic text-center py-4">Sem eventos futuros.</p>
                    )}
                </div>
            </div>
            
            {/* SEARCH */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                   <Clock size={16} className="text-gray-400"/> Histórico
                </h3>
                
                <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        placeholder="Buscar eventos..."
                        value={pastSearchTerm}
                        onChange={(e) => setPastSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600"
                    />
                </div>
                
                 <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                     {displayedEvents
                      .filter(e => {
                          const eDate = new Date(e.date);
                          eDate.setHours(0,0,0,0);
                          const today = new Date();
                          today.setHours(0,0,0,0);
                          return eDate < today; 
                      })
                      .filter(e => e.title.toLowerCase().includes(pastSearchTerm.toLowerCase()))
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(event => (
                        <div key={event.id} 
                             onClick={() => setSelectedEvent(event)}
                             className="p-2 rounded bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all flex justify-between items-center"
                        >
                            <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]" title={event.title}>{event.title}</span>
                            <span className="text-[10px] text-gray-400">{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                    ))}
                    {displayedEvents.filter(e => {
                        const d = new Date(e.date); d.setHours(0,0,0,0);
                        const t = new Date(); t.setHours(0,0,0,0);
                        return d < t;
                    }).filter(e => e.title.toLowerCase().includes(pastSearchTerm.toLowerCase())).length === 0 && (
                         <p className="text-xs text-slate-400 italic text-center py-2">Nada encontrado.</p>
                    )}
                </div>
            </div>
        </div>

        {/* Main Calendar Grid */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="grid grid-cols-7 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-sm font-semibold text-slate-500 py-2 uppercase tracking-wide">
                        {day}
                    </div>
                ))}
            </div>
            {view === 'month' && (
                <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                    {calendarCells.map((cell, idx) => {
                        const dayEvents = getEventsForDate(cell.date)
                        return (
                            <div 
                                key={idx} 
                                className={`
                                    bg-white min-h-[120px] p-2 transition-colors hover:bg-slate-50
                                    ${!cell.isCurrentMonth ? 'bg-slate-50/50 text-slate-400' : ''}
                                    ${cell.isToday ? 'bg-blue-50/10' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`
                                        text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full
                                        ${cell.isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700'}
                                    `}>
                                        {cell.date.getDate()}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {dayEvents.map(event => (
                                        <button 
                                            key={event.id}
                                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(event) }}
                                            className="w-full text-left text-[10px] md:text-xs p-1 rounded bg-blue-100 text-blue-800 truncate hover:bg-blue-200 transition-colors font-medium border border-blue-200"
                                            title={`${event.time} - ${event.title}`}
                                        >
                                            {event.time} {event.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
     </div>
     
     {/* Event Modal */}
     {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                    <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Detalhes do Evento</p>
                        <h2 className="text-xl font-bold text-slate-800">{selectedEvent.title}</h2>
                    </div>
                    <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600">
                        <Plus size={24} className="rotate-45" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                         <div className="flex items-center gap-2 text-slate-600">
                             <Clock size={18} className="text-blue-500" />
                             <div>
                                 <p className="text-xs text-slate-400 uppercase font-semibold">Data</p>
                                 <p className="font-medium">{new Date(selectedEvent.date).toLocaleDateString()} às {selectedEvent.time}</p>
                             </div>
                         </div>
                         <div className="flex items-center gap-2 text-slate-600">
                             <MapPin size={18} className="text-red-500" />
                             <div>
                                 <p className="text-xs text-slate-400 uppercase font-semibold">Local</p>
                                 <p className="font-medium">{selectedEvent.location || 'Não informado'}</p>
                             </div>
                         </div>
                     </div>
                     
                     <div>
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Descrição</h4>
                        <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                            {selectedEvent.description || 'Sem descrição.'}
                        </p>
                     </div>

                     <div>
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Participantes</h4>
                        <div className="flex flex-wrap gap-2 text-sm max-h-24 overflow-y-auto">
                             {users.filter(u => selectedEvent.userIds.includes(u.id)).map(u => (
                                 <span key={u.id} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full flex items-center gap-1 border border-slate-200">
                                     <User size={12} /> {u.name}
                                 </span>
                             ))}
                        </div>
                     </div>
                </div>
                 {canEdit && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button 
                            onClick={(e) => handleDeleteEvent(e, selectedEvent.id)}
                            className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={16} /> Excluir Evento
                        </button>
                    </div>
                )}
             </div>
        </div>
     )}
     

     {/* New Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">Agendar Novo Evento</h3>
                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                        <Plus size={24} className="rotate-45" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                        <input 
                            type="text" 
                            className="input-field w-full"
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                            <input 
                                type="date" 
                                className="input-field w-full"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
                            <input 
                                type="time" 
                                className="input-field w-full"
                                value={formData.time}
                                onChange={e => setFormData({...formData, time: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Local</label>
                        <input 
                            type="text" 
                            className="input-field w-full"
                            value={formData.location}
                            onChange={e => setFormData({...formData, location: e.target.value})}
                            placeholder="Ex: Sala de Reunião 1 ou Online"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                        <textarea 
                            className="input-field w-full h-24 resize-none"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        ></textarea>
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Convidar Usuários</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2">
                             {users.map(user => (
                                 <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors"onClick={() => toggleUser(user.id)}>
                                     <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.userIds.includes(user.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                         {formData.userIds.includes(user.id) && <Plus size={12} className="text-white" />}
                                     </div>
                                     <span className="text-sm text-slate-700">{user.name}</span>
                                     <span className="text-xs text-slate-400 uppercase ml-auto font-medium text-slate-500">{user.role}</span>
                                 </div>
                             ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">* Selecione quem verá este evento.</p>
                     </div>
                </form>
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                    <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} className="btn-primary">Criar Evento</button>
                </div>
             </div>
        </div>
      )}

    </div>
  )
}
