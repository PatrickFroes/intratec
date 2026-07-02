'use client'

import { useAppStore, DEFAULT_PERMISSIONS_ADMIN, DEFAULT_PERMISSIONS_USER } from '@/lib/store'
import { CheckSquare, Plus, Trash2, Search, User, Filter } from 'lucide-react'
import { useState, useMemo } from 'react'

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
}

export default function Tarefas() {
  const { tasks, currentUser, users, addTask, updateTask, removeTask } = useAppStore()
  
  const permissions = currentUser?.permissions || (currentUser?.role === 'admin' ? DEFAULT_PERMISSIONS_ADMIN : DEFAULT_PERMISSIONS_USER)
  const canEdit = permissions.tarefas === 'editor'
  const [showForm, setShowForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    userIds: [] as string[]
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  // Lógica otimizada de filtragem, busca e ordenação
  const sortedTasks = useMemo(() => {
    // 1. Cria mapa de usuários para busca O(1) (Performance)
    const userMap = new Map(users.map(u => [u.id, u.name]))
    
    const term = searchTerm.toLowerCase()
    const isAdmin = currentUser?.role === 'admin' || currentUser?.permissions?.tarefas === 'editor' // Ajuste conforme sua regra de admin
    const currentUserId = currentUser?.id || ''

    return tasks
      .filter((task) => {
        // 2. Filtro de Segurança
        const isOwner = task.userIds?.includes(currentUserId)
        const hasPermission = isAdmin || isOwner
        if (!hasPermission) return false

        // 2.1 Filtros de Propriedade (Status e Prioridade)
        if (statusFilter !== 'all' && task.status !== statusFilter) return false
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false

        // 3. Filtro de Busca
        if (!term) return true

        const titleMatch = task.title.toLowerCase().includes(term)
        const descMatch = task.description?.toLowerCase().includes(term)
        
        // Busca nos nomes apenas se necessário
        if (titleMatch || descMatch) return true

        const ownerNamesVal = task.userIds?.map(uid => userMap.get(uid) || '').join(' ').toLowerCase()
        return ownerNamesVal.includes(term)
      })
      .sort((a, b) => {
        // 4. Ordenação (Decrescente)
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      })
      .map(t => ({
        // 5. Enriquecimento de dados para UI
        ...t,
        ownerNames: t.userIds?.map(uid => userMap.get(uid)).filter(Boolean).join(', ') || 'Sem responsável'
      }))
  }, [tasks, currentUser, users, searchTerm, statusFilter, priorityFilter])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.userIds.length === 0) {
        alert('Selecione pelo menos um responsável para a tarefa')
        return
    }
    if (formData.title && formData.dueDate) {
      addTask({
        userIds: formData.userIds,
        title: formData.title,
        description: formData.description,
        status: 'pending',
        priority: formData.priority,
        dueDate: new Date(formData.dueDate),
      })
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        userIds: []
      })
      setShowForm(false)
    }
  }

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTask(taskId, {
      status: newStatus as 'pending' | 'in_progress' | 'completed',
    })
    if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus })
    }
  }

  const handleDeleteTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      removeTask(id)
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask(null)
      }
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Minhas Tarefas</h1>
          <p className="text-gray-600 mt-2">Exibindo {sortedTasks.length} tarefas</p>
        </div>
        {canEdit && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> Nova Tarefa
        </button>
        )}
      </div>

      {/* Search Bar & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
            type="text"
            placeholder="Buscar tarefas por título, descrição ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
        </div>
        
        <div className="flex gap-4">
             <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white min-w-[150px]"
                >
                    <option value="all">Todos os Status</option>
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em Progresso</option>
                    <option value="completed">Concluída</option>
                </select>
             </div>

             <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white min-w-[150px]"
                >
                    <option value="all">Todas as Prioridades</option>
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                </select>
             </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <span className={`text-xs px-2 py-1 rounded font-semibold uppercase ${priorityColors[selectedTask.priority as keyof typeof priorityColors]}`}>
                                Prioridade {selectedTask.priority === 'low' ? 'Baixa' : selectedTask.priority === 'medium' ? 'Média' : 'Alta'}
                             </span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">{selectedTask.title}</h2>
                    </div>
                    <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600">
                        <Plus size={24} className="rotate-45" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Descrição</h4>
                        <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[80px]">
                            {selectedTask.description || <span className="text-slate-400 italic">Sem descrição.</span>}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Vencimento</h4>
                            <p className="font-medium text-slate-800 flex items-center gap-2">
                               {new Date(selectedTask.dueDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Status Atual</h4>
                            <select
                                disabled={!canEdit}
                                value={selectedTask.status}
                                onChange={(e) => handleStatusChange(selectedTask.id, e.target.value)}
                                className={`text-sm px-3 py-1.5 rounded-lg w-full cursor-pointer border-none ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none ${
                                statusColors[selectedTask.status as keyof typeof statusColors]
                                } ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                <option value="pending">Pendente</option>
                                <option value="in_progress">Em Progresso</option>
                                <option value="completed">Concluída</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <div className="flex gap-2">
                     {canEdit && (
                     <button
                        onClick={(e) => {
                          handleDeleteTask(e, selectedTask.id);
                        }}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={18} /> Excluir
                      </button>
                      )}
                    <button onClick={() => setSelectedTask(null)} className="btn-secondary">
                        Fechar
                    </button>
                  </div>
                </div>
             </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold mb-4">Criar Nova Tarefa</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Título da tarefa"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="input-field"
              required
            />

            <textarea
              placeholder="Descrição"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input-field h-24"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as 'low' | 'medium' | 'high',
                  })
                }
                className="input-field"
              >
                <option value="low">Baixa Prioridade</option>
                <option value="medium">Média Prioridade</option>
                <option value="high">Alta Prioridade</option>
              </select>

              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="input-field"
                required
              />
            </div>

            <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Responsáveis</label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-white">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <input 
                        type="checkbox"
                        checked={formData.userIds.includes(user.id)}
                        onChange={(e) => {
                           if (e.target.checked) {
                              setFormData({ ...formData, userIds: [...formData.userIds, user.id] })
                           } else {
                              setFormData({ ...formData, userIds: formData.userIds.filter(id => id !== user.id) })
                           }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{user.name}</span>
                      <span className="text-xs text-slate-400">({user.email})</span>
                    </label>
                  ))}
                </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                Criar Tarefa
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 gap-4">
        {sortedTasks.map((task) => (
          <div key={task.id} className="card cursor-pointer hover:border-blue-300 transition-all hover:shadow-md group" onClick={() => setSelectedTask(task)}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {task.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      priorityColors[task.priority]
                    }`}
                  >
                    {task.priority === 'low'
                      ? 'Baixa'
                      : task.priority === 'medium'
                        ? 'Média'
                        : 'Alta'}
                  </span>
                </div>

                {task.description && (
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                )}
                
                <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
                    <User size={14} className="text-blue-500" />
                    <span className="font-medium text-gray-700">Responsável:</span> {task.ownerNames}
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  <span  onClick={(e) => e.stopPropagation()} className="cursor-auto"> {/* Prevent click grouping */}
                    <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded cursor-pointer ${
                        statusColors[task.status]
                        }`}
                    >
                        <option value="pending">Pendente</option>
                        <option value="in_progress">Em Progresso</option>
                        <option value="completed">Concluída</option>
                    </select>
                  </span>

                  <span className="text-sm text-gray-600">
                    Vencimento: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <button 
                onClick={(e) => handleDeleteTask(e, task.id)}
                className="p-2 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors text-gray-600"
                title="Excluir tarefa"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {sortedTasks.length === 0 && !showForm && (
        <div className="text-center py-12">
          <CheckSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Nenhuma tarefa atribuída</p>
        </div>
      )}
    </div>
  )
}
