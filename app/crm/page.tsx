'use client'

import { useAppStore, Lead, LeadStatus, Interaction, InteractionType } from '@/lib/store'
import { useEffect, useState } from 'react'
import { Plus, Search, Phone, Building, User, ArrowRight, Trash2, Clock, Send } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { v4 as uuidv4 } from 'uuid'
import { WhatsAppButton } from '@/components/WhatsAppButton'

const STATUS_COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'new', label: 'Novo Lead', color: 'bg-blue-100 border-blue-300 text-blue-800' },
  { id: 'contacted', label: 'Em Contato', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  { id: 'visit', label: 'Visita Agendada', color: 'bg-purple-100 border-purple-300 text-purple-800' },
  { id: 'negotiation', label: 'Negociação', color: 'bg-orange-100 border-orange-300 text-orange-800' },
  { id: 'won', label: 'Fechado', color: 'bg-green-100 border-green-300 text-green-800' },
  { id: 'lost', label: 'Perdido', color: 'bg-gray-100 border-gray-300 text-gray-800' },
]

export default function CRMPage() {
  const { leads, properties, currentUser, fetchLeads, addLead, updateLead, removeLead } = useAppStore()
  
  // -- Access Control --
  const permissions = currentUser?.permissions || { crm: 'none' }
  // @ts-ignore
  const canView = permissions.crm && permissions.crm !== 'none'
  // @ts-ignore
  const canEdit = permissions.crm === 'editor'

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingLead, setEditingLead] = useState<Lead | null>(null)

  // Initial Form State
  const [formData, setFormData] = useState<Partial<Lead>>({
    status: 'new',
    intendedSize: 0,
    interactions: []
  })
  
  // -- Access Guard --
  if (!canView) {
      return (
          <div className="flex h-[50vh] items-center justify-center">
              <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-800">Acesso Restrito</h2>
                  <p className="text-slate-500 mt-2">Você não tem permissão para acessar o módulo de CRM.</p>
              </div>
          </div>
      )
  }

  // New Interaction State

  // New Interaction State
  const [newInteraction, setNewInteraction] = useState('')
  const [interactionType, setInteractionType] = useState<InteractionType>('note')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    fetchLeads()
  }, [fetchLeads])

  if (!isMounted) return null


  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.niche.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId as LeadStatus
    
    // Optimistic Update can be tricky with DnD libraries if not handled carefully with state
    // We update store immediately
    updateLead(draggableId, { status: newStatus })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.phone) return alert('Nome e Telefone são obrigatórios')

    try {
      if (editingLead) {
        await updateLead(editingLead.id, formData)
      } else {
        await addLead({
          name: formData.name!,
          phone: formData.phone!,
          email: formData.email || '',
          document: formData.document || '',
          companyName: formData.companyName || '',
          niche: formData.niche || '',
          targetPropertyId: formData.targetPropertyId || '',
          intendedSize: Number(formData.intendedSize) || 0,
          status: (formData.status as LeadStatus) || 'new',
          notes: formData.notes || '',
          agentId: currentUser?.id || 'admin',
        })
      }
      setIsModalOpen(false)
      setEditingLead(null)
      setFormData({ status: 'new', intendedSize: 0, interactions: [] })
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar lead')
    }
  }

  const handleAddInteraction = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newInteraction.trim() || !editingLead) return

      const interaction: Interaction = {
          id: uuidv4(),
          type: interactionType,
          content: newInteraction,
          date: new Date(),
          createdBy: currentUser?.name || 'Sistema'
      }

      const updatedInteractions = [interaction, ...(editingLead.interactions || [])]
      
      // Update local state immediately for UI 
      setFormData(prev => ({ ...prev, interactions: updatedInteractions }))
      // Also update the source lead in store if we are in "edit mode" to persist
      // Actually, we should wait for the main "Save" button? 
      // Usually timelines are "live". Let's update the lead immediately.
      
      try {
          // We update the backend immediately for interactions
          await updateLead(editingLead.id, { interactions: updatedInteractions })
          // Update the `editingLead` state as well so it doesn't get desynced
          setEditingLead({ ...editingLead, interactions: updatedInteractions })
          
          setNewInteraction('')
      } catch (err) {
          alert('Erro ao salvar interação')
      }
  }

  const openEdit = (lead: Lead) => {
    setEditingLead(lead)
    setFormData(lead)
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
      if (!editingLead) return
      if (confirm('Tem certeza que deseja excluir este lead?')) {
          await removeLead(editingLead.id)
          setIsModalOpen(false)
          setEditingLead(null)
      }
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">CRM de Vendas</h1>
            <p className="text-gray-500">Gestão de leads e funil de vendas</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar leads..." 
                    className="input-field pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {canEdit && (
                <button 
                    onClick={() => {
                        setEditingLead(null)
                        setFormData({ status: 'new', intendedSize: 0, interactions: [] })
                        setIsModalOpen(true)
                    }}
                    className="btn-primary flex items-center gap-2 whitespace-nowrap"
                >
                    <Plus size={18} /> Novo Lead
                </button>
            )}
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={canEdit ? handleDragEnd : () => {}}>
        <div className="flex-1 overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1200px] h-full">
                {STATUS_COLUMNS.map(col => (
                    <div key={col.id} className="flex-1 bg-gray-100/50 rounded-xl flex flex-col min-h-[500px]">
                        {/* Column Header */}
                        <div className={`p-3 rounded-t-xl border-b border-gray-200 flex justify-between items-center ${col.color} bg-opacity-20`}>
                            <span className="font-bold text-sm">{col.label}</span>
                            <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">
                                {filteredLeads.filter(l => l.status === col.id).length}
                            </span>
                        </div>
                        
                        {/* Droppable Area */}
                        <Droppable droppableId={col.id}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`p-2 flex-1 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}`}
                                >
                                    {filteredLeads
                                        .filter(l => l.status === col.id)
                                        .map((lead, index) => (
                                            <Draggable key={lead.id} draggableId={lead.id} index={index} isDragDisabled={!canEdit}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        onClick={() => openEdit(lead)}
                                                        className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-3 hover:shadow-md transition-shadow cursor-pointer group ${snapshot.isDragging ? 'rotate-2 shadow-lg ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                                                        style={{ ...provided.draggableProps.style }}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="font-bold text-gray-800 text-sm line-clamp-1">{lead.companyName || lead.name}</span>
                                                            {lead.niche && (
                                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                    {lead.niche}
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        {lead.companyName && (
                                                            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                                                <User size={10} /> {lead.name}
                                                            </p>
                                                        )}

                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center text-xs text-gray-600 gap-2">
                                                                    <Phone size={12} className="text-gray-400" />
                                                                    {lead.phone}
                                                                </div>
                                                                <WhatsAppButton 
                                                                    phone={lead.phone} 
                                                                    compact 
                                                                    className="w-6 h-6" 
                                                                    message={`Olá ${lead.name.split(' ')[0]}, falo do Shopping.`}
                                                                />
                                                            </div>
                                                            {lead.targetPropertyId && (
                                                                <div className="flex items-center text-xs text-gray-600 gap-2">
                                                                    <Building size={12} className="text-gray-400" />
                                                                    <span className="truncate max-w-[150px]">
                                                                        {properties.find(p => p.id === lead.targetPropertyId)?.name || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
                                                            <span>{new Date(lead.updatedAt).toLocaleDateString()}</span>
                                                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </div>
      </DragDropContext>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">{editingLead ? 'Editar Lead' : 'Novo Lead'}</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* LEFT COLUMN: FORM */}
                    <div className="flex-1 overflow-y-auto p-6 border-r border-gray-200">
                        <form id="lead-form" onSubmit={handleSubmit} className="space-y-4">
                            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <User size={18} /> Dados do Lead
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Nome do Contato *</label>
                                    <input 
                                        className="input-field w-full" 
                                        value={formData.name || ''} 
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="label">Nome da Empresa / Fantasia</label>
                                    <input 
                                        className="input-field w-full" 
                                        value={formData.companyName || ''} 
                                        onChange={e => setFormData({...formData, companyName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="label">Telefone *</label>
                                    <input 
                                        className="input-field w-full" 
                                        type="tel"
                                        value={formData.phone || ''} 
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="label">Email</label>
                                    <input 
                                        className="input-field w-full" 
                                        type="email"
                                        value={formData.email || ''} 
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="label">CNPJ / CPF</label>
                                    <input 
                                        className="input-field w-full" 
                                        value={formData.document || ''} 
                                        onChange={e => setFormData({...formData, document: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="label">Nicho / Segmento</label>
                                    <input 
                                        className="input-field w-full" 
                                        placeholder="Ex: Vestuário, Alimentação..."
                                        value={formData.niche || ''} 
                                        onChange={e => setFormData({...formData, niche: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="label">Empreendimento de Interesse</label>
                                    <select 
                                        className="input-field w-full" 
                                        value={formData.targetPropertyId || ''} 
                                        onChange={e => setFormData({...formData, targetPropertyId: e.target.value})}
                                    >
                                        <option value="">Selecione...</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Área Pretendida (m²)</label>
                                    <input 
                                        className="input-field w-full" 
                                        type="number"
                                        value={formData.intendedSize || ''} 
                                        onChange={e => setFormData({...formData, intendedSize: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                            
                            {/* Status Selection */}
                            <div>
                                <label className="label">Status</label>
                                <select 
                                    className="input-field w-full"
                                    value={formData.status || 'new'}
                                    onChange={e => setFormData({...formData, status: e.target.value as LeadStatus})}
                                >
                                    {STATUS_COLUMNS.map(col => (
                                        <option key={col.id} value={col.id}>{col.label}</option>
                                    ))}
                                </select>
                            </div>

                        </form>
                    </div>

                    {/* RIGHT COLUMN: TIMELINE (Only visible if editing an existing lead) */}
                    {editingLead ? (
                        <div className="w-full lg:w-96 bg-gray-50 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200">
                             <div className="p-4 border-b border-gray-200 bg-white">
                                 <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                     <Clock size={18} /> Histórico
                                 </h3>
                             </div>
                             
                             {/* Interaction List */}
                             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                 {(!formData.interactions || formData.interactions.length === 0) && (
                                     <p className="text-gray-400 text-center text-sm py-4">Nenhuma interação registrada.</p>
                                 )}
                                 {formData.interactions?.map((interaction) => (
                                     <div key={interaction.id} className="bg-white p-3 rounded shadow-sm border border-gray-100 text-sm">
                                         <div className="flex justify-between items-start mb-1">
                                             <div className="flex items-center gap-2">
                                                 <span className={`p-1 rounded text-[10px] font-bold uppercase 
                                                    ${interaction.type === 'call' ? 'bg-green-100 text-green-700' : 
                                                      interaction.type === 'meeting' ? 'bg-purple-100 text-purple-700' :
                                                      interaction.type === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                 >
                                                     {interaction.type}
                                                 </span>
                                                 <span className="font-bold text-gray-700">{interaction.createdBy}</span>
                                             </div>
                                             <span className="text-xs text-gray-400">
                                                 {new Date(interaction.date).toLocaleDateString()} {new Date(interaction.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                             </span>
                                         </div>
                                         <p className="text-gray-600 whitespace-pre-wrap">{interaction.content}</p>
                                     </div>
                                 ))}
                             </div>

                             {/* Interaction Input */}
                             {canEdit && (
                                 <div className="p-4 bg-white border-t border-gray-200">
                                     <form onSubmit={handleAddInteraction}>
                                         <div className="flex gap-2 mb-2">
                                             {(['note', 'call', 'meeting', 'email'] as InteractionType[]).map(type => (
                                                 <button
                                                     key={type}
                                                     type="button"
                                                     onClick={() => setInteractionType(type)}
                                                     className={`flex-1 py-1 rounded text-xs font-medium border transition-colors ${
                                                         interactionType === type 
                                                             ? 'bg-blue-100 border-blue-300 text-blue-800' 
                                                             : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                     }`}
                                                 >
                                                     {type === 'note' ? 'Nota' : type === 'call' ? 'Ligação' : type === 'meeting' ? 'Reunião' : 'Email'}
                                                 </button>
                                             ))}
                                         </div>
                                         <div className="flex gap-2">
                                             <textarea
                                                 className="input-field flex-1 resize-none h-10 py-2 min-h-[40px]"
                                                 placeholder="Adicionar nota..."
                                                 value={newInteraction}
                                                 onChange={e => setNewInteraction(e.target.value)}
                                                 onKeyDown={e => {
                                                     if(e.key === 'Enter' && !e.shiftKey) {
                                                         e.preventDefault()
                                                         handleAddInteraction(e)
                                                     }
                                                 }}
                                             />
                                             <button type="submit" disabled={!newInteraction.trim()} className="btn-primary px-3">
                                                 <Send size={16} />
                                             </button>
                                         </div>
                                     </form>
                                 </div>
                             )}
                        </div>
                    ) : (
                        <div className="w-full lg:w-96 bg-gray-50 flex items-center justify-center p-8 text-center text-gray-400 border-l border-gray-200">
                            <div>
                                <Clock size={48} className="mx-auto mb-2 opacity-20" />
                                <p>Salve o lead primeiro para adicionar interações.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                     {editingLead && canEdit ? (
                        <button type="button" onClick={handleDelete} className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm">
                            <Trash2 size={16} /> Excluir Lead
                        </button>
                    ) : <span></span>}
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                        {/* We use form ID to trigger submit from outside since form is nested now */}
                        {canEdit && (
                            <button type="submit" form="lead-form" className="btn-primary">Salvar Alterações</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  )
}
