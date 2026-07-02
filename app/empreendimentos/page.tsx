'use client'

import { useAppStore } from '@/lib/store'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Store, MapPin, Phone, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Suspense, useState, useEffect } from 'react'

function PropertyDetails() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { properties, stores, isInitialized, currentUser, visitProperty } = useAppStore()
  
  const permissions = currentUser?.permissions || (currentUser?.role === 'admin' ? { cadastros: 'editor' } : { cadastros: 'none' })
  // @ts-ignore
  const canEdit = permissions.cadastros === 'editor'

  const [isClient, setIsClient] = useState(false)
  
  // Prevent Hydration mismatches by only rendering dependent content on client
  useEffect(() => {
    setIsClient(true)
  }, [])

  const propertyId = searchParams.get('id')
  
  // Register visit
  useEffect(() => {
      if (isClient && propertyId) {
          visitProperty(propertyId)
      }
  }, [isClient, propertyId, visitProperty])
  
  // Handle case with no ID - Redirect to list view in Cadastros
  useEffect(() => {
      if (isClient && !propertyId) {
          router.replace('/cadastros?tab=properties')
      }
  }, [isClient, propertyId, router])
  
  // Show loading while initializing or redirecting
  if (!propertyId || !isInitialized || !isClient) {
     return (
        <div className="flex h-[50vh] items-center justify-center">
             <div className="flex flex-col items-center gap-2">
                 <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-slate-500">Carregando dados do empreendimento...</p>
             </div>
        </div>
     )
  }

  const property = properties.find(p => p.id === propertyId)

  if (!property) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-slate-200 m-8 animate-in fade-in">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Empreendimento não encontrado</h1>
        <p className="text-gray-500 mb-6">O empreendimento solicitado não existe ou o link pode estar quebrado.</p>
        <Link href="/" className="text-blue-600 hover:underline flex items-center justify-center gap-2">
           <ArrowLeft size={16} /> Voltar para o Dashboard
        </Link>
      </div>
    )
  }

  const propertyStores = stores.filter(s => s.propertyId === propertyId)
  
  const totalStores = propertyStores.length
  
  // Capacity Calculations
  const capacity = property.capacity || 50
  const occupancyRate = capacity > 0 ? Math.min(Math.round((totalStores / capacity) * 100), 100) : 0

  // Area Calculations (ABL - Área Bruta Locável)
  const totalArea = property.totalArea || 0
  const occupiedArea = propertyStores.reduce((acc, store) => acc + (store.area || 0), 0)
  const areaOccupancyRate = totalArea > 0 ? Math.min(Math.round((occupiedArea / totalArea) * 100), 100) : 0
  
  const categories = propertyStores.reduce((acc, store) => {
    acc[store.category] = (acc[store.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sortedCategories = Object.entries(categories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)

  return (
    <div className="page-container space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-4 transition-colors"
        >
          <ArrowLeft size={18} /> Voltar
        </button>
        
        {property.image && (
             <div className="w-full h-64 md:h-96 bg-gray-100 rounded-xl mb-6 overflow-hidden shadow-sm border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={property.image} alt={property.name} className="w-full h-full object-cover" />
             </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="heading-1">{property.name}</h1>
            <div className="flex items-center gap-4 text-slate-500 mt-2 flex-wrap">
              <span className="flex items-center gap-1"><MapPin size={16} /> {property.city}</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1"><Phone size={16} /> {property.phone}</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1"><Users size={16} /> Gerente: {property.manager}</span>
            </div>
          </div>
          {canEdit && (
          <Link href={`/cadastros?tab=properties&type=property&editId=${property.id}`}>
            <button className="btn-secondary gap-2 flex items-center">
                <div className="w-4 h-4"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></div>
                Editar Empreendimento
            </button>
          </Link>
          )}
        </div>
      </div>

      {/* Analytical Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Total de Lojas</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{totalStores}</h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-600/20">
                  <Store size={22} />
                </div>
            </div>
            <div className="mt-4 text-sm text-slate-500">
                De {capacity} espaços disponíveis
            </div>
        </div>

        <div className="card group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Ocupação (Lojas)</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{occupancyRate}%</h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/20">
                  <TrendingUp size={22} />
                </div>
            </div>
            <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${occupancyRate}%` }}></div>
            </div>
        </div>

        <div className="card group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Área Locada (ABL)</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{totalArea > 0 ? `${areaOccupancyRate}%` : 'N/A'}</h3>
                </div>
                <div className="p-3 rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-600/20">
                  <MapPin size={22} />
                </div>
            </div>
            <div className="mt-4 text-sm text-slate-500">
                {occupiedArea}m² de {totalArea}m²
            </div>
        </div>
        
        {/* Category Breakdown */}
         <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Top Categorias</h3>
            <div className="flex gap-4 flex-wrap">
                {sortedCategories.map(([cat, count]) => (
                    <div key={cat} className="flex flex-col items-center p-3 bg-slate-50 rounded-lg border border-slate-100 min-w-[100px] flex-1">
                        <span className="text-2xl font-bold text-slate-700">{count}</span>
                        <span className="text-xs text-slate-500 uppercase font-medium mt-1 text-center">{cat}</span>
                    </div>
                ))}
                {sortedCategories.length === 0 && <span className="text-slate-400">Nenhuma loja cadastrada</span>}
            </div>
         </div>
      </div>

      {/* Stores List */}
      <div className="space-y-4">
        <h2 className="heading-2">Lojas do Empreendimento</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {propertyStores.map((store) => (
             <Link href={`/lojas?id=${store.id}`} key={store.id}>
                <div className="card hover:border-blue-200 transition-colors cursor-pointer group relative overflow-hidden h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Store size={20} />
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                        {store.category}
                    </span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">{store.name}</h3>
                <p className="text-sm text-slate-500 mb-3 line-clamp-1">Gerente: {store.manager}</p>
                
                <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Phone size={14} /> {store.phone}
                    </div>
                </div>
                </div>
            </Link>
          ))}
          
          {propertyStores.length === 0 && (
             <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                 <Store className="mx-auto mb-2 opacity-50" size={32} />
                 <p>Nenhuma loja cadastrada neste empreendimento.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EmpreendimentoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando dados...</div>}>
      <PropertyDetails />
    </Suspense>
  )
}
