'use client'

import { useAppStore } from '@/lib/store'
import {
  DollarSign,
  Briefcase,
  AlertTriangle,
  Calendar,
  Grid,
  Filter,
  PieChart,
  Layers,
  ChevronDown,
  Building2,
  TrendingUp
} from 'lucide-react'
import { useMemo, useState } from 'react'

// --- COMPONENTS ---

interface MultiSelectProps {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (values: string[]) => void
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const selectedLabels = selected.map(v => options.find(o => o.value === v)?.label).filter(Boolean)

  return (
    <div className="relative min-w-[200px] flex-1">
      <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1 uppercase">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="input-field w-full text-left flex justify-between items-center bg-white min-h-[42px]"
      >
        <span className="truncate text-sm text-slate-700 block pr-2">
          {selected.length === 0 
            ? 'Todos' 
            : selected.length === 1 
                ? selectedLabels[0] 
                : `${selected.length} selecionados`}
        </span>
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-lg max-h-60 overflow-y-auto z-20 p-2 animate-in fade-in zoom-in-95 duration-100">
            <div
              className="p-2 hover:bg-slate-50 cursor-pointer rounded text-sm font-semibold text-blue-600 mb-1 border-b border-slate-100 flex justify-between items-center"
              onClick={() => {
                onChange([])
              }}
            >
              <span>Selecionar Todos</span>
              {selected.length > 0 && <span className="text-xs font-normal text-slate-400">Limpar filtros</span>}
            </div>
            {options.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => handleToggle(opt.value)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
            {options.length === 0 && (
                <div className="p-2 text-sm text-slate-400 text-center">Nenhuma opção disponível</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function Relatorios() {
  const { stores, properties, users } = useAppStore()
  
  // -- STATE: Filters & Layers --
  const [activeTab, setActiveTab] = useState<'general' | 'financial' | 'occupancy' | 'contracts'>('general')
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])

  // -- FILTERING LOGIC --
  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchProperty = selectedProperties.length === 0 || selectedProperties.includes(store.propertyId)
      const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(store.category)
      const matchAgent = selectedAgents.length === 0 || (store.agentId && selectedAgents.includes(store.agentId))
      
      return matchProperty && matchCategory && matchAgent
    })
  }, [stores, selectedProperties, selectedCategories, selectedAgents])

  const filteredProperties = useMemo(() => {
    return selectedProperties.length === 0 
      ? properties 
      : properties.filter(p => selectedProperties.includes(p.id))
  }, [properties, selectedProperties])

  // -- CALCULATIONS (Based on Filtered Data) --

  // 1. Financial: Revenue Calculations
  const revenueStats = useMemo(() => {
    let totalRevenue = 0
    const revenueByProperty: Record<string, number> = {}

    filteredStores.forEach(store => {
      // Exclude 'Vaga' from revenue calculations (it's potential, not actual income)
      if (store.category === 'Vaga') return

      const rent = Number(store.rentValue) || 0
      totalRevenue += rent
      
      const propId = store.propertyId
      if (propId) {
        revenueByProperty[propId] = (revenueByProperty[propId] || 0) + rent
      }
    })

    return { totalRevenue, revenueByProperty }
  }, [filteredStores])

  // 2. Category Distribution
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredStores.forEach(s => {
      const cat = s.category || 'Outros'
      counts[cat] = (counts[cat] || 0) + 1
    })
    // Sort by count desc
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [filteredStores])

  // 3. Occupancy (Global or filtered)
  const occupancyData = useMemo(() => {
      return filteredProperties.map(p => {
          // If filtered locally by property, we use 'stores' (global) to correctly calc occupancy 
          // OR filteredStores if we want to see occupancy of specific categories?
          // Usually occupancy is physical, so category filter shouldn't affect "Occupied Area" unless we enable specific logic. 
          // But to be consistent with "Filters", let's use global stores for the property to show TRUE occupancy, 
          // BUT maybe highlight the filtered ones? 
          // Re-reading user request: "Filtros ... para tornar utilizável".
          // If I filter by "Pharmacy", I expect to see data about Pharmacies.
          // But Occupancy Rate of a Shopping based ONLY on Pharmacies doesn't make sense (it would be low).
          // Let's keep Occupancy calc based on PROPERTY context (ignoring category filter for the RATE), 
          // but maybe show count of filtered stores.
          
          // Actually, let's stick to the filtered dataset for consistency in "Relatórios", 
          // except for totalArea/Capacity which are fixed Property attributes.

          const pStores = filteredStores.filter(s => s.propertyId === p.id)
          // const allPropertyStores = stores.filter(s => s.propertyId === p.id) // For true physical occupancy reference if needed

          const occupiedArea = pStores.reduce((acc, s) => acc + (Number(s.area) || 0), 0)
          const count = pStores.length
          const capacity = p.capacity || 1
          const totalArea = p.totalArea || 1
          
          return {
              id: p.id,
              name: p.name,
              occupiedArea,
              totalArea,
              areaRate: Math.min((occupiedArea / totalArea) * 100, 100).toFixed(1),
              storeCount: count,
              capacity: capacity,
              unitRate: Math.min((count / capacity) * 100, 100).toFixed(1)
          }
      })
  }, [filteredProperties, filteredStores])

  // 4. Expirations
  const expirations = useMemo(() => {
      const today = new Date()
      // const warningDate = new Date()
      // warningDate.setDate(today.getDate() + 90)

      return filteredStores
        .filter(s => s.contractEnd)
        .map(s => {
             const endDate = new Date(s.contractEnd!)
             const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
             return { ...s, daysLeft, endDate }
        })
        .filter(s => s.daysLeft <= 90 && s.status !== 'inactive')
        .sort((a,b) => a.daysLeft - b.daysLeft)
  }, [filteredStores])

  // 5. Advanced Category Insights
  const categoryInsights = useMemo(() => {
    const stats: Record<string, { count: number, totalArea: number, totalRevenue: number }> = {}
    let grandTotalArea = 0

    filteredStores.forEach(s => {
        const cat = s.category || 'Outros'
        const area = Number(s.area) || 0
        // Exclude 'Vaga' from revenue in insights
        const rent = (s.category === 'Vaga') ? 0 : (Number(s.rentValue) || 0)
        
        if (!stats[cat]) stats[cat] = { count: 0, totalArea: 0, totalRevenue: 0 }
        
        stats[cat].count++
        stats[cat].totalArea += area
        stats[cat].totalRevenue += rent
        grandTotalArea += area
    })

    return Object.entries(stats).map(([category, data]) => ({
        category,
        ...data,
        avgArea: data.totalArea / (data.count || 1),
        avgRent: data.totalRevenue / (data.count || 1),
        areaShare: grandTotalArea > 0 ? (data.totalArea / grandTotalArea) * 100 : 0
    })).sort((a,b) => b.totalRevenue - a.totalRevenue)
  }, [filteredStores])

  // -- OPTIONS LISTS --
  const propertyOptions = useMemo(() => 
    properties.map(p => ({ value: p.id, label: p.name })).sort((a,b) => a.label.localeCompare(b.label))
  , [properties])

  const categoryOptions = useMemo(() => {
    const cats = new Set(stores.map(s => s.category).filter(Boolean))
    return Array.from(cats).sort().map(c => ({ value: c, label: c }))
  }, [stores])

  const agentOptions = useMemo(() => 
    users.map(u => ({ value: u.id, label: u.name })).sort((a,b) => a.label.localeCompare(b.label))
  , [users])

  return (
    <div className="page-container space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
           <h1 className="heading-1">Relatórios Gerenciais</h1>
           <p className="text-slate-500 mt-2 text-lg">Análise detalhada e estratégica do portfólio.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
                <Briefcase size={18} /> Exportar PDF
            </button>
        </div>
      </div>

      {/* FILTER BAR - REDESIGNED */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center relative z-20">
          <div className="flex items-center gap-2 text-slate-500 font-medium mr-2 self-center">
              <Filter size={20} />
              <span className="hidden md:inline">Filtros:</span>
          </div>
          
          <div className="w-full flex-1 flex flex-col md:flex-row gap-4">
              <MultiSelect 
                  label="Empreendimentos" 
                  options={propertyOptions} 
                  selected={selectedProperties} 
                  onChange={setSelectedProperties} 
              />
              
              <MultiSelect 
                  label="Categorias" 
                  options={categoryOptions} 
                  selected={selectedCategories} 
                  onChange={setSelectedCategories} 
              />

              <MultiSelect 
                  label="Corretor Responsável" 
                  options={agentOptions} 
                  selected={selectedAgents} 
                  onChange={setSelectedAgents} 
              />
          </div>

           {/* Filter Count Badge */}
           <div className="hidden lg:block min-w-[120px] text-center text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 self-center">
               <span className="font-bold text-slate-800 block text-lg">{filteredStores.length}</span>
               <span className="text-xs">Registros</span>
           </div>
      </div>


      {/* TABS (LAYERS) */}
      <div className="border-b border-slate-200">
          <nav className="flex gap-6 overflow-x-auto pb-1" aria-label="Tabs">
              {[
                { id: 'general', label: 'Visão Geral', icon: Grid },
                { id: 'financial', label: 'Financeiro', icon: DollarSign },
                { id: 'occupancy', label: 'Ocupação', icon: Layers },
                { id: 'contracts', label: 'Contratos & Prazos', icon: Calendar },
              ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                            ${isActive 
                                ? 'border-blue-500 text-blue-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                        `}
                    >
                        <Icon size={18} />
                        {tab.label}
                    </button>
                  )
              })}
          </nav>
      </div>

      {/* CONTENT LAYERS */}
      
      {/* 1. LAYER: GENERAL */}
      {activeTab === 'general' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card flex items-center justify-between border-l-4 border-l-green-500">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Receita Filtrada</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenueStats.totalRevenue)}
                        </h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <DollarSign size={20} />
                    </div>
                </div>
                
                <div className="card flex items-center justify-between border-l-4 border-l-blue-500">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Lojas Analisadas</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">
                            {filteredStores.length}
                        </h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Briefcase size={20} />
                    </div>
                </div>

                <div className="card flex items-center justify-between border-l-4 border-l-amber-500">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Alertas de Contrato</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">
                            {expirations.length}
                        </h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                        <AlertTriangle size={20} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="card">
                     <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                         <PieChart size={20} className="text-indigo-500" /> Distribuição por Categoria
                     </h3>
                     <div className="space-y-3">
                         {categoryStats.slice(0, 6).map(([cat, count]) => {
                             const percentage = (count / filteredStores.length) * 100
                             return (
                                 <div key={cat} className="group">
                                     <div className="flex justify-between text-sm mb-1">
                                         <span className="text-slate-600 font-medium group-hover:text-blue-600 transition-colors">{cat}</span>
                                         <span className="text-slate-400 text-xs">{percentage.toFixed(1)}% ({count})</span>
                                     </div>
                                     <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                         <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                     </div>
                                 </div>
                             )
                         })}
                     </div>
                 </div>

                 <div className="card">
                     <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                          <Building2 size={20} className="text-blue-500" /> Top Receitas (Por Shopping)
                     </h3>
                     <div className="space-y-4">
                         {Object.entries(revenueStats.revenueByProperty)
                            .sort((a,b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([propId, revenue]) => {
                                const propName = properties.find(p => p.id === propId)?.name || 'Desconhecido'
                                const percentage = (revenue / revenueStats.totalRevenue) * 100
                                return (
                                    <div key={propId}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-slate-700">{propName}</span>
                                            <span className="font-bold text-slate-900">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenue)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div 
                                              className="bg-blue-600 h-2 rounded-full" 
                                              style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )
                         })}
                     </div>
                 </div>
            </div>
        </div>
      )}

      {/* 2. LAYER: FINANCIAL */}
      {activeTab === 'financial' && (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="card overflow-hidden">
                 <h3 className="font-bold text-slate-800 mb-6">Performance Financeira Detalhada</h3>
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                         <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                             <tr>
                                 <th className="px-4 py-3">Categoria</th>
                                 <th className="px-4 py-3 text-right">Qtd. Lojas</th>
                                 <th className="px-4 py-3 text-right">Área Total (m²)</th>
                                 <th className="px-4 py-3 text-right">Receita Total</th>
                                 <th className="px-4 py-3 text-right">Aluguel Médio</th>
                                 <th className="px-4 py-3 text-right">R$/m²</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                             {categoryInsights.map((cat) => (
                                 <tr key={cat.category} className="hover:bg-slate-50 transition-colors">
                                     <td className="px-4 py-3 font-medium text-slate-700">{cat.category}</td>
                                     <td className="px-4 py-3 text-right text-slate-600">{cat.count}</td>
                                     <td className="px-4 py-3 text-right text-slate-600">{cat.totalArea.toLocaleString('pt-BR')}</td>
                                     <td className="px-4 py-3 text-right text-green-600 font-semibold">
                                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.totalRevenue)}
                                     </td>
                                     <td className="px-4 py-3 text-right text-slate-600">
                                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.avgRent)}
                                     </td>
                                     <td className="px-4 py-3 text-right text-blue-600 font-medium">
                                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.totalRevenue / (cat.totalArea || 1))}
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                         <tfoot className="bg-slate-50 font-bold text-slate-800">
                             <tr>
                                 <td className="px-4 py-3">TOTAL</td>
                                 <td className="px-4 py-3 text-right">{filteredStores.length}</td>
                                 <td className="px-4 py-3 text-right">
                                     {categoryInsights.reduce((acc, c) => acc + c.totalArea, 0).toLocaleString('pt-BR')}
                                 </td>
                                 <td className="px-4 py-3 text-right text-green-700">
                                     {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenueStats.totalRevenue)}
                                 </td>
                                 <td className="px-4 py-3 text-right">-</td>
                                 <td className="px-4 py-3 text-right text-blue-700">
                                     {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                         revenueStats.totalRevenue / (categoryInsights.reduce((acc, c) => acc + c.totalArea, 0) || 1)
                                     )}
                                 </td>
                             </tr>
                         </tfoot>
                     </table>
                 </div>
             </div>
         </div>
      )}

      {/* 3. LAYER: OCCUPANCY */}
      {activeTab === 'occupancy' && (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {occupancyData.map((data) => (
                     <div key={data.id} className="card relative overflow-hidden group">
                         <div className="flex justify-between items-start mb-4">
                             <div>
                                 <h3 className="font-bold text-slate-800 text-lg">{data.name}</h3>
                                 <p className="text-slate-500 text-xs uppercase font-semibold mt-1">Capacidade Total</p>
                             </div>
                             <div className={`
                                w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                                ${Number(data.areaRate) > 80 ? 'bg-green-100 text-green-700' : Number(data.areaRate) > 50 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}
                             `}>
                                 {Math.round(Number(data.areaRate))}%
                             </div>
                         </div>
                         
                         <div className="space-y-4">
                             <div>
                                 <div className="flex justify-between text-sm mb-1">
                                     <span className="text-slate-600">Ocupação (Área)</span>
                                     <span className="font-semibold text-slate-900">{data.occupiedArea} / {data.totalArea} m²</span>
                                 </div>
                                 <div className="w-full bg-gray-100 rounded-full h-2">
                                     <div 
                                       className={`h-2 rounded-full transition-all duration-1000 ${Number(data.areaRate) > 80 ? 'bg-green-500' : 'bg-blue-500'}`} 
                                       style={{ width: `${data.areaRate}%` }}
                                     ></div>
                                 </div>
                             </div>

                             <div>
                                 <div className="flex justify-between text-sm mb-1">
                                     <span className="text-slate-600">Unidades Alugadas</span>
                                     <span className="font-semibold text-slate-900">{data.storeCount} / {data.capacity}</span>
                                 </div>
                                 <div className="w-full bg-gray-100 rounded-full h-2">
                                     <div 
                                       className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" 
                                       style={{ width: `${data.unitRate}%` }}
                                     ></div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
         </div>
      )}

      {/* 4. LAYER: CONTRACTS */}
      {activeTab === 'contracts' && (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="card">
                 <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <Calendar size={20} className="text-amber-500" /> Próximos Vencimentos
                 </h3>
                 
                 {expirations.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Loja</th>
                                    <th className="px-4 py-3">Empreendimento</th>
                                    <th className="px-4 py-3">Fim do Contrato</th>
                                    <th className="px-4 py-3">Dias Restantes</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {expirations.map((store) => {
                                    const propName = properties.find(p => p.id === store.propertyId)?.name
                                    const isCritical = store.daysLeft <= 30
                                    
                                    return (
                                        <tr key={store.id} className={isCritical ? 'bg-red-50/50' : ''}>
                                            <td className="px-4 py-3 font-semibold text-slate-700">{store.name}</td>
                                            <td className="px-4 py-3 text-slate-600">{propName}</td>
                                            <td className="px-4 py-3 text-slate-600">{store.endDate.toLocaleDateString()}</td>
                                            <td className={`px-4 py-3 font-bold ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                                                {store.daysLeft} dias
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {isCritical ? 'CRÍTICO' : 'ATENÇÃO'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                 ) : (
                     <div className="text-center py-12 bg-slate-50 border border-dashed rounded-lg">
                         <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                             <TrendingUp size={24} />
                         </div>
                         <h3 className="text-slate-800 font-semibold">Tudo tranquilo!</h3>
                         <p className="text-slate-500 text-sm">Nenhum contrato vencendo nos próximos 90 dias com os filtros atuais.</p>
                     </div>
                 )}
             </div>
         </div>
      )}

    </div>
  )
}
