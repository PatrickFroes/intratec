'use client'

import { useAppStore } from '@/lib/store' // Assuming direct import works like in other files
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Mail, Phone, FileText, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'

function ClientProfileContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { clients, stores, properties, currentUser } = useAppStore()

  const permissions = currentUser?.permissions || (currentUser?.role === 'admin' ? { clientes: 'editor' } : { clientes: 'none' })
  // @ts-ignore
  const canEdit = permissions.clientes === 'editor'
  
  const clientId = searchParams.get('id')
  const client = clients.find(c => c.id === clientId)
  
  // Filter stores associated with this client
  const clientStores = stores.filter(s => s.clientId === clientId)

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  if (!clientId || !client) {
     // Check if it's just loading (though clients array usually starts empty then fills)
     // If accessing directly, data might take a moment.
     
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-400">Cliente não encontrado</h1>
            </div>
             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-800">
                <p>O cliente solicitado não foi localizado na base de dados local.</p>
                <p className="text-sm mt-2">Aguarde a sincronização ou verifique se o ID está correto.</p>
             </div>
             <Link href="/cadastros" className="text-blue-600 hover:underline mt-6 inline-block font-medium">Voltar para a lista de cadastros</Link>
        </div>
    )
  }

  // Handle Date safely
  const formatDate = (date: any) => {
      if (!date) return '-'
      try {
          return new Date(date).toLocaleDateString('pt-BR')
      } catch (e) {
          return String(date)
      }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
            <Link href="/cadastros" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ArrowLeft size={24} />
            </Link>
            <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${clientStores.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <p className="text-gray-500 text-sm font-medium">
                    {clientStores.length > 0 ? 'Cliente Ativo (Com Lojas)' : 'Sem lojas ativas'}
                </p>
            </div>
            </div>
        </div>
        {canEdit && (
        <Link href={`/cadastros?tab=clients&type=client&editId=${client.id}`}>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2 transition-colors">
                <div className="w-4 h-4"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></div>
                Editar Cliente
            </button>
        </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Client Details */}
        <div className="lg:col-span-1 space-y-6">
            <div className="card bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-6 border-b pb-4 flex items-center gap-2 text-gray-800">
                    <User size={20} className="text-blue-600"/> Dados Cadastrais
                </h2>
                <div className="space-y-6">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1 mb-1.5">
                            <FileText size={14} /> Documento
                        </label>
                        <p className="text-gray-900 font-medium text-lg tracking-wide">{client.document}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1 mb-1.5">
                            <Mail size={14} /> Email
                        </label>
                        <p className="text-gray-900 break-words">{client.email || '-'}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1 mb-1.5">
                            <Phone size={14} /> Telefone
                        </label>
                        <p className="text-gray-900">{client.phone || '-'}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1 mb-1.5">
                            <Calendar size={14} /> Data de Cadastro
                        </label>
                        <p className="text-gray-900">
                            {formatDate(client.createdAt)}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Associated Stores & Analytics */}
        <div className="lg:col-span-2 space-y-6">
            <div className="card bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                        <Building2 size={20} className="text-blue-600"/> Lojas Associadas
                    </h2>
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100 shadow-sm">
                        {clientStores.length} LOJA{clientStores.length !== 1 && 'S'}
                    </span>
                </div>

                {clientStores.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clientStores.map(store => {
                            const property = properties.find(p => p.id === store.propertyId)
                            return (
                                <div key={store.id} className="p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all bg-white group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">{store.name}</h3>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{store.category}</span>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-3 flex items-center gap-1.5">
                                        <Building2 size={14} className="text-gray-400"/>
                                        {property?.name || 'Empreendimento desconhecido'}
                                    </div>
                                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
                                        <div>
                                            <span className="text-xs text-gray-500 block">Gerente</span>
                                            <span className="text-gray-900 font-medium">{store.manager || '-'}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-gray-500 block">Área</span>
                                            <span className="text-gray-900 font-medium">{store.area} m²</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                        {canEdit && (
                        <Link href="/cadastros?tab=lojas" className="btn-primary inline-flex items-center gap-2">
                             <span className="text-xl leading-none">+</span> Cadastrar nova loja
                        </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}

export default function ClientProfile() {
    return (
        <Suspense fallback={<div className="p-8">Carregando...</div>}>
            <ClientProfileContent />
        </Suspense>
    )
}
