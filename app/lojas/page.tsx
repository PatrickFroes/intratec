'use client'

import { useAppStore } from '@/lib/store'
import { Store, User, Building2, ArrowRight, ArrowLeft, Calendar, DollarSign, Ruler, Clock, Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { WhatsAppButton } from '@/components/WhatsAppButton'

function StoreContent() {
  const { stores, properties, clients, currentUser } = useAppStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const permissions = currentUser?.permissions || (currentUser?.role === 'admin' ? { cadastros: 'editor' } : { cadastros: 'none' })
  // @ts-ignore
  const canEdit = permissions.cadastros === 'editor'
  
  const storeId = searchParams.get('id')
  const [isMounted, setIsMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  // ================= DASHBOARD VIEW (SINGLE STORE) =================
  if (storeId) {
    const store = stores.find(s => s.id === storeId)
    const client = store ? clients.find(c => c.id === store.clientId) : undefined
    const isAdmin = currentUser?.role === 'admin'
    
    // Check Permission
    const isAgent = store?.agentId === currentUser?.id || client?.agentId === currentUser?.id
    const hasAccess = isAdmin || isAgent
    
    if (!store || !hasAccess) {
         return (
             <div className="p-8 max-w-4xl mx-auto">
                 <div className="flex items-center gap-4 mb-8">
                     <button onClick={() => router.push('/lojas')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                         <ArrowLeft size={24} />
                     </button>
                     <h1 className="text-2xl font-bold text-gray-400">Loja não encontrada ou acesso negado</h1>
                 </div>
                 <Link href="/lojas" className="text-blue-600 hover:underline">Voltar para a lista</Link>
             </div>
         )
    }

    const property = properties.find(p => p.id === store.propertyId)

    // Calculations
    const parseDate = (dateStr?: string) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
    }
    
    const startDate = parseDate(store.contractStart)
    const endDate = parseDate(store.contractEnd)
    const now = new Date()
    
    // Calculate contract progress
    let progress = 0
    let daysRemaining = 0
    // let totalDays = 0 // Removed unused variable
    let statusColor = "bg-green-500"
    let statusText = "Contrato Vigente"

    if (startDate && endDate) {
        const totalDuration = endDate.getTime() - startDate.getTime()
        const elapsed = now.getTime() - startDate.getTime()
        
        // totalDays = Math.ceil(totalDuration / (1000 * 60 * 60 * 24))
        daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (totalDuration > 0) {
            progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
        }

        if (daysRemaining < 0) {
            progress = 100
            statusColor = "bg-red-500"
            statusText = "Contrato Expirado"
        } else if (daysRemaining < 90) { // Less than 3 months
             statusColor = "bg-yellow-500"
             statusText = "Renovação Próxima"
        }
    }

    const valuePerSqm = (store.rentValue && store.area) ? (store.rentValue / store.area) : 0

    return (
        <div className="p-8 max-w-6xl mx-auto">
             {store.image && (
                 <div className="w-full h-64 md:h-80 bg-gray-100 rounded-2xl mb-8 overflow-hidden shadow-sm border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                 </div>
             )}
             {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/lojas" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        {store.name}
                        <span className={`text-sm text-white px-3 py-1 rounded-full ${statusColor}`}>
                                {statusText}
                        </span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1 text-gray-500">
                            <Building2 size={16} />
                            <span>{property?.name}</span>
                            <span className="mx-2">•</span>
                            <span>{store.category}</span>
                    </div>
                    </div>
                </div>
                {canEdit && (
                <Link href={`/cadastros?tab=stores&type=store&editId=${store.id}`}>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2 transition-colors">
                        <div className="w-4 h-4"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></div>
                        Editar Loja
                    </button>
                </Link>
                )}
                
                {store.phone && (
                    <WhatsAppButton 
                        phone={store.phone}
                        label="Falar com Gerente"
                        message={`Olá ${store.manager?.split(' ')[0] || 'Gerente'}, contato sobre a ${store.name}.`}
                    />
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Stats Cards */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm text-gray-500 font-medium uppercase">Valor do Aluguel</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                {store.rentValue ? `R$ ${store.rentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}
                            </h3>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    {valuePerSqm > 0 && (
                        <p className="text-xs text-blue-600 font-medium bg-blue-50 inline-block px-2 py-1 rounded">
                            R$ {valuePerSqm.toFixed(2)} / m²
                        </p>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm text-gray-500 font-medium uppercase">Área da Loja</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                {store.area} m²
                            </h3>
                        </div>
                        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                            <Ruler size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-400">Dimensão física cadastrada</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm text-gray-500 font-medium uppercase">Vencimento Contrato</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                {daysRemaining > 0 ? `${daysRemaining} dias` : (endDate ? 'Vencido' : 'N/A')}
                            </h3>
                        </div>
                        <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                            <Clock size={24} />
                        </div>
                    </div>
                     {endDate && (
                        <p className="text-sm text-gray-500">
                           Data final: {endDate.toLocaleDateString('pt-BR')}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Contract & Progress Details */}
                 <div className="lg:col-span-2 space-y-6">
                      {/* Progress Bar */}
                      {(startDate && endDate) && (
                          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                  <Calendar size={18} className="text-blue-500"/> Linha do Tempo do Contrato
                              </h3>
                              
                              <div className="relative pt-6 pb-2">
                                  <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                                      <span>Início: {startDate.toLocaleDateString('pt-BR')}</span>
                                      <span>Fim: {endDate.toLocaleDateString('pt-BR')}</span>
                                  </div>
                                  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                            progress >= 100 ? 'bg-red-500' : progress > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}
                                        style={{ width: `${progress}%` }}
                                      ></div>
                                  </div>
                                  <div className="flex justify-center mt-2">
                                      <span className="text-sm font-bold text-gray-700">{progress.toFixed(1)}% Cumprido</span>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* General Info */}
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                           <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Store size={18} className="text-blue-500"/> Detalhes Operacionais
                           </h3>
                           <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Gerente da Loja</label>
                                    <p className="text-gray-800 font-medium">{store.manager || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Telefone</label>
                                    <p className="text-gray-800 font-medium">{store.phone || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Categoria</label>
                                    <p className="text-gray-800 font-medium">{store.category}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Status Sistema</label>
                                    <p className="text-gray-800 font-medium capitalize">{store.status || 'Ativo'}</p>
                                </div>
                           </div>
                      </div>
                 </div>

                 {/* Sidebar: Client Info */}
                 <div className="lg:col-span-1">
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                           <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <User size={18} className="text-blue-500"/> Responsável (Locatário)
                           </h3>
                           
                           {client ? (
                               <div className="space-y-4">
                                   <div>
                                       <p className="text-lg font-bold text-gray-900">{client.name}</p>
                                       <p className="text-sm text-gray-500">{client.email}</p>
                                   </div>
                                   <div className="pt-4 border-t border-gray-100">
                                       <label className="text-xs text-gray-400 uppercase font-bold">Documento</label>
                                       <p className="text-gray-700 font-mono text-sm">{client.document}</p>
                                   </div>
                                   <div className="flex flex-col gap-2 mt-4">
                                       {client.phone && (
                                           <WhatsAppButton 
                                             phone={client.phone}
                                             label="Falar com Cliente"
                                             message={`Olá, contato sobre a loja ${store.name}.`}
                                             className="w-full justify-center"
                                           />
                                       )}
                                       <Link 
                                         href={`/clientes?id=${client.id}`}
                                         className="btn-secondary w-full flex justify-center items-center gap-2"
                                       >
                                           Ver Perfil do Cliente <ArrowRight size={16} />
                                       </Link>
                                   </div>
                               </div>
                           ) : (
                               <div className="text-gray-500 italic text-sm">
                                   Cliente responsável não encontrado ou removido.
                               </div>
                           )}
                      </div>
                 </div>
            </div>
        </div>
    )
  }

  // ================= LIST VIEW (ALL STORES) =================
  const getPropertyName = (propertyId: string) => {
    return properties.find((p) => p.id === propertyId)?.name || 'N/A'
  }

  // Filter stores based on search term
  const filteredStores = stores.filter(store => {
    // Permission Filter
    const isAdmin = currentUser?.role === 'admin'
    const client = clients.find(c => c.id === store.clientId)
    const isManager = store.manager === currentUser?.name
    const isClientOwner = client?.email === currentUser?.email
    
    if (!isAdmin && !isManager && !isClientOwner) return false

    const property = properties.find(p => p.id === store.propertyId)
    
    const searchString = searchTerm.toLowerCase()
    return (
      store.name.toLowerCase().includes(searchString) ||
      store.category.toLowerCase().includes(searchString) ||
      (property?.name || '').toLowerCase().includes(searchString) ||
      (client?.name || '').toLowerCase().includes(searchString)
    )
  })

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
           <h1 className="text-4xl font-bold text-gray-900">Lojas</h1>
           <p className="text-gray-600 mt-2">Exibindo {filteredStores.length} de {stores.length} lojas</p>
        </div>
        {canEdit && (
        <Link href="/cadastros?tab=stores" className="btn-primary flex items-center gap-2">
            + Nova Loja
        </Link>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome, categoria, local ou gerente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores.map((store) => (
          <Link href={`/lojas?id=${store.id}`} key={store.id} className="card hover:shadow-lg transition-all hover:border-blue-400 group cursor-pointer block">
            {store.image && (
                <div className="h-40 w-full bg-gray-100 rounded-lg mb-4 overflow-hidden border border-gray-100 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                </div>
            )}
            <div className="flex items-start justify-between mb-4">
              <Store className="text-blue-600 group-hover:scale-110 transition-transform" size={24} />
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                {store.category}
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors flex justify-between items-center">
                {store.name}
                <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"/>
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Building2 size={16} />
                <span>{getPropertyName(store.propertyId)}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <User size={16} />
                <span>{store.manager || 'Sem gerente'}</span>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                 <span className="text-gray-500 text-xs uppercase font-bold">Área</span>
                 <span className="font-semibold text-gray-900">{store.area} m²</span>
              </div>
            </div>
          </Link>
        ))}
        {stores.length === 0 && (
            <div className="col-span-full py-16 text-center bg-gray-50 rounded-lg border-2 border-dashed">
                <Store size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Nenhuma loja cadastrada ainda.</p>
            </div>
        )}
      </div>
    </div>
  )
}

export default function Lojas() {
    return (
        <Suspense fallback={<div className="p-8">Carregando...</div>}>
            <StoreContent />
        </Suspense>
    )
}
