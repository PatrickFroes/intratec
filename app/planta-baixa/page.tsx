'use client'

import { useAppStore, DEFAULT_PERMISSIONS_ADMIN, DEFAULT_PERMISSIONS_USER } from '@/lib/store'
import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { ZoomIn, ZoomOut, Info, MapPin, Upload, Edit3, Save, X, Palette, Loader2, DollarSign, Store, Maximize2 } from 'lucide-react'
// import { compressImage } from '@/lib/utils'
import { MarkerLayer } from './components/MarkerLayer'
import Link from 'next/link'
import { uploadImageAction } from '@/app/actions/storage'

// Rebuild of PlantaBaixa Page
export default function PlantaBaixaPage() {
    const { properties, stores, users, currentUser, updateProperty, uploadFloorPlan, fetchFloorPlan, visitProperty } = useAppStore()
    
    // -- Permissions --
    const permissions = currentUser?.permissions || (currentUser?.role === 'admin' ? DEFAULT_PERMISSIONS_ADMIN : DEFAULT_PERMISSIONS_USER)
    const canManageFloorPlan = permissions.plantaBaixa === 'editor'
    const isAdmin = currentUser?.role === 'admin'

    // -- Selection State --
    const availableProperties = properties.filter(p => isAdmin || stores.some(s => s.propertyId === p.id && s.agentId === currentUser?.id))
    const [selectedPropertyId, setSelectedPropertyId] = useState(availableProperties[0]?.id || '')
    const currentProperty = properties.find(p => p.id === selectedPropertyId)

    // -- Floor Plan Image State --
    const [floorPlanImage, setFloorPlanImage] = useState<string | null>(null)
    const [isLoadingImage, setIsLoadingImage] = useState(false)
    const [imageError, setImageError] = useState<string | null>(null)
    const [imgSize, setImgSize] = useState({ width: 0, height: 0 })

    // -- UI State --
    const [zoom, setZoom] = useState(1)
    const [viewMode, setViewMode] = useState<'image' | 'svg'>('image') // Default to image if available
    const [showInfo, setShowInfo] = useState(true)
    const [isEditMode, setIsEditMode] = useState(false)
    const [hoveredStore, setHoveredStore] = useState<string | null>(null)
    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null) // Interactivity state
    const [activeTool, setActiveTool] = useState<'none' | 'add-store' | 'add-agent'>('none')
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null) // StoreID or UserID to place

    const imageContainerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // -- Effects --
    
    // 0. Register Visit
    useEffect(() => {
        if (selectedPropertyId) {
            visitProperty(selectedPropertyId)
        }
    }, [selectedPropertyId, visitProperty])

    // 1. Fetch Image when Property Changes
    useEffect(() => {
        if (!selectedPropertyId) {
             setFloorPlanImage(null)
             return
        }
        
        const load = async () => {
            setIsLoadingImage(true)
            setImageError(null)
            setFloorPlanImage(null) // Reset first
            setImgSize({ width: 0, height: 0 })
            try {
                const img = await fetchFloorPlan(selectedPropertyId)
                if (img) {
                    setFloorPlanImage(img)
                    setViewMode('image')
                } else {
                    setViewMode('svg')
                }
            } catch (err) {
                console.error("Failed to load floor plan", err)
                setImageError("Erro ao carregar a planta baixa.")
                setViewMode('svg')
            } finally {
                setIsLoadingImage(false)
            }
        }
        load()
    }, [selectedPropertyId, fetchFloorPlan]) // Removed fetchFloorPlan from deps to avoid loop if store changes

    // Update selected if needed when properties change
    useEffect(() => {
         if (availableProperties.length > 0 && !selectedPropertyId) {
             setSelectedPropertyId(availableProperties[0].id)
         }
    }, [availableProperties, selectedPropertyId])

    // -- Handlers --

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !currentProperty) return

        if (file.size > 20 * 1024 * 1024) { // 20MB check
             alert('Arquivo muito grande. Máximo 20MB.')
             return
        }

        try {
            setIsLoadingImage(true)
            
            // Upload directly to S3 without compression
            const formData = new FormData()
            formData.append('file', file)
            
            const uploadRes = await uploadImageAction(formData)
            
            if (!uploadRes.success || !uploadRes.url) {
                throw new Error(uploadRes.error)
            }

            const imageUrl = uploadRes.url

            // 3. Save URL to separate table (DynamoDB FloorPlans table now stores URL)
            await uploadFloorPlan(currentProperty.id, imageUrl)
            
            // 4. Update local state
            setFloorPlanImage(imageUrl)
            setViewMode('image')
            alert('Planta baixa salva com sucesso!')
        } catch (error: any) {
            console.error('Upload failed', error)
            alert(`Erro no upload: ${error.message}`)
        } finally {
            setIsLoadingImage(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isEditMode) {
             // If clicking generic map area, deselect store
             setSelectedStoreId(null)
             return
        }
        if (!currentProperty || !imageContainerRef.current) return

        const rect = imageContainerRef.current.getBoundingClientRect()
        // Calculate percentage coordinates
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        if (activeTool === 'add-store' && selectedEntityId) {
            // Optimistic update handled by store, but we need to ensure not to send the Image
            const newM = { storeId: selectedEntityId, x, y }
            const updated = [...(currentProperty.storeMarkers || []).filter(m => m.storeId !== selectedEntityId), newM]
            
            // CRITICAL: We pass only the markers, avoiding re-sending any image data if it was in the property object (which it shouldn't be anymore)
            updateProperty(currentProperty.id, { storeMarkers: updated })
            
            // Auto deselect? No, allow re-positioning or keep tool active?
            // Let's reset tool for Store (usually 1:1)
            setActiveTool('none')
            setSelectedEntityId(null)
        } 
        else if (activeTool === 'add-agent' && selectedEntityId) {
            const newM = { id: uuidv4(), agentId: selectedEntityId, x, y }
            const updated = [...(currentProperty.agentMarkers || []), newM]
            updateProperty(currentProperty.id, { agentMarkers: updated })
            // Keep tool active for agents (multiple pins)
        }
    }

    const handleRemoveMarker = (id: string, type: 'store' | 'agent') => {
        if (!currentProperty) return
        if (type === 'store') {
            const updated = (currentProperty.storeMarkers || []).filter(m => m.storeId !== id)
            updateProperty(currentProperty.id, { storeMarkers: updated })
        } else {
            const updated = (currentProperty.agentMarkers || []).filter(m => m.id !== id)
            updateProperty(currentProperty.id, { agentMarkers: updated })
        }
    }

    // -- Derived Data --
    const propertyStores = stores.filter(s => s.propertyId === selectedPropertyId && (isAdmin || s.agentId === currentUser?.id))
    const storesWithoutMarkers = propertyStores.filter(s => !currentProperty?.storeMarkers?.some(m => m.storeId === s.id))
    const storesWithMarkers = propertyStores.filter(s => currentProperty?.storeMarkers?.some(m => m.storeId === s.id))

    return (
        <div className="flex h-full flex-col bg-gray-50 relative overflow-hidden">
            {/* Header / Toolbar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm z-30 relative gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight whitespace-nowrap">
                        Planta Baixa
                    </h1>
                    
                    <div className="relative w-full sm:w-64">
                        <select 
                            className="appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-4 pr-10 py-2.5 font-medium transition-colors hover:bg-gray-100 cursor-pointer shadow-sm"
                            value={selectedPropertyId}
                            onChange={(e) => {
                                setSelectedPropertyId(e.target.value) 
                                setIsEditMode(false)
                            }}
                        >
                            {availableProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                           <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                     {/* Upload Button */}
                     <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                     {canManageFloorPlan && (
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-2"
                            disabled={isLoadingImage}
                        >
                            {isLoadingImage ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                            <span className="hidden sm:inline">Upload Planta</span>
                        </button>
                     )}

                     {/* Edit Toggle */}
                     {viewMode === 'image' && (
                        <button 
                             onClick={() => {
                                 if (isEditMode) {
                                     // Saving logic is implicit (Optimistic), just turn off mode
                                     setIsEditMode(false)
                                     setActiveTool('none')
                                 } else {
                                     setIsEditMode(true)
                                 }
                             }}
                             className={`btn text-sm px-3 py-1.5 flex items-center gap-2 ${
                                 isEditMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                             }`}
                        >
                             {isEditMode ? <Save size={16} /> : <Edit3 size={16} />}
                             <span className="hidden sm:inline">{isEditMode ? 'Finalizar Edição' : 'Editar Marcadores'}</span>
                        </button>
                     )}
                     
                     {/* Info Toggle */}
                     <button onClick={() => setShowInfo(!showInfo)} className="p-2 hover:bg-gray-100 rounded text-gray-600">
                        <Info size={20} />
                     </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative z-0">
                {/* CANVAS AREA */}
                <div className="flex-1 overflow-hidden relative bg-slate-100 shadow-inner">
                    {/* Zoom Controls Overlay */}
                    <div className="absolute top-4 right-4 flex flex-col gap-1 z-10 bg-white shadow-md rounded-lg p-1">
                        <button onClick={() => setZoom(z => Math.min(z + 0.2, 4))} className="p-2 hover:bg-gray-50"><ZoomIn size={20}/></button>
                        <button onClick={() => setZoom(1)} className="p-2 hover:bg-gray-50 text-xs font-bold">1x</button>
                        <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-2 hover:bg-gray-50"><ZoomOut size={20}/></button>
                    </div>

                    <div className="w-full h-full overflow-auto relative">
                        <div className="min-w-full min-h-full w-fit flex items-center justify-center p-[500px]">
                            {isLoadingImage ? (
                            <div className="flex flex-col items-center text-gray-400">
                                <Loader2 className="animate-spin mb-2" size={32} />
                                <p>Carregando planta...</p>
                            </div>
                        ) : imageError ? (
                             <div className="text-red-500 text-center">
                                 <p className="font-bold">Erro</p>
                                 <p>{imageError}</p>
                             </div>
                        ) : viewMode === 'image' && floorPlanImage ? (
                            <div 
                                className="relative shadow-xl ring-1 ring-black/5 flex-none"
                                style={{ 
                                    width: imgSize.width ? imgSize.width * zoom : 'auto',
                                    height: imgSize.height ? imgSize.height * zoom : 'auto',
                                    cursor: isEditMode && activeTool !== 'none' ? 'crosshair' : 'default'
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={floorPlanImage} 
                                    alt="Floor Plan" 
                                    className={`block select-none max-w-none max-h-none ${imgSize.width ? 'w-full h-full' : 'w-auto h-auto'}`}
                                    draggable={false}
                                    onLoad={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        setImgSize({ width: target.naturalWidth, height: target.naturalHeight });
                                    }}
                                />
                                {/* Click Capture Overlay */}
                                <div 
                                    ref={imageContainerRef}
                                    className="absolute inset-0 z-0"
                                    onClick={handleMapClick}
                                />
                                
                                {/* Markers */}
                                {currentProperty && (
                                    <MarkerLayer 
                                        storeMarkers={currentProperty.storeMarkers || []}
                                        agentMarkers={currentProperty.agentMarkers || []}
                                        stores={stores}
                                        users={users}
                                        scale={1}
                                        isAdmin={isAdmin}
                                        currentUserId={currentUser?.id || ''}
                                        agentColors={currentProperty.agentColors}
                                        onStoreClick={(id) => {
                                            if (isEditMode) return
                                            setSelectedStoreId(id)
                                            setShowInfo(true)
                                        }}
                                        onStoreHover={setHoveredStore}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 max-w-md">
                                <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium text-gray-900">Sem Planta Baixa</h3>
                                <p className="mt-1">Faça upload de uma imagem para começar a posicionar as lojas.</p>
                                {canManageFloorPlan && (
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="mt-4 btn-primary"
                                    >
                                        Fazer Upload Agora
                                    </button>
                                )}
                            </div>
                        )}
                        </div>
                    </div>
                </div>

                {/* SIDEBAR */}
                {showInfo && (
                    <div className="w-80 border-l border-gray-200 bg-white flex flex-col shadow-xl z-20">
                         {isEditMode ? (
                             <div className="p-4 flex flex-col h-full">
                                 <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                     <Edit3 size={18} /> Editor de Mapa
                                 </h3>
                                 
                                 {/* Edit Tabs */}
                                 <div className="flex border-b border-gray-200 mb-4">
                                     <button 
                                        className={`flex-1 py-2 text-sm font-medium ${activeTool === 'add-store' || activeTool === 'none' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                                        onClick={() => { setActiveTool('add-store'); setSelectedEntityId(null) }}
                                     >
                                        Lojas
                                     </button>
                                     <button 
                                        className={`flex-1 py-2 text-sm font-medium ${activeTool === 'add-agent' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                                        onClick={() => { setActiveTool('add-agent'); setSelectedEntityId(null) }}
                                     >
                                        Corretores
                                     </button>
                                 </div>

                                 <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                     {(activeTool === 'add-store' || activeTool === 'none') ? (
                                        <div className="space-y-3">
                                            {storesWithoutMarkers.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Disponíveis ({storesWithoutMarkers.length})</p>
                                                    <div className="space-y-2">
                                                        {storesWithoutMarkers.map(store => (
                                                            <button 
                                                                key={store.id}
                                                                onClick={() => {
                                                                    setActiveTool('add-store')
                                                                    setSelectedEntityId(store.id)
                                                                }}
                                                                className={`w-full text-left p-3 rounded border transition-all ${
                                                                    selectedEntityId === store.id 
                                                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                                                                        : 'border-gray-200 hover:border-blue-300'
                                                                }`}
                                                            >
                                                                <div className="font-medium text-sm text-gray-900">{store.name}</div>
                                                                <div className="text-xs text-gray-500">{store.category}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {storesWithMarkers.length > 0 && (
                                                <div className="pt-4 border-t">
                                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Já no Mapa ({storesWithMarkers.length})</p>
                                                     <div className="space-y-1">
                                                        {storesWithMarkers.map(store => (
                                                            <div key={store.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                                                <span className="truncate">{store.name}</span>
                                                                <button 
                                                                    onClick={() => handleRemoveMarker(store.id, 'store')}
                                                                    className="text-red-500 hover:bg-red-100 p-1 rounded"
                                                                    title="Remover marcador"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                     </div>
                                                </div>
                                            )}
                                        </div>
                                     ) : (
                                         <div className="space-y-3">
                                             <p className="text-sm text-gray-600 mb-2">Clique em um corretor para ativar o modo &quot;Carimbo&quot; e adicionar múltiplos pontos.</p>
                                             {users.map(user => {
                                                  // Show simple color picker
                                                  const activeColor = currentProperty?.agentColors?.[user.id] || user.color || '#333'
                                                  
                                                  return (
                                                     <div 
                                                        key={user.id}
                                                        className={`p-3 rounded border transition-all ${
                                                            selectedEntityId === user.id 
                                                                ? 'border-blue-500 bg-blue-50' 
                                                                : 'border-gray-200'
                                                        }`}
                                                     >
                                                        <div 
                                                            className="flex items-center gap-3 cursor-pointer"
                                                            onClick={() => {
                                                                setActiveTool('add-agent')
                                                                setSelectedEntityId(selectedEntityId === user.id ? null : user.id)
                                                            }}
                                                        >
                                                            <div 
                                                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                                                                style={{ backgroundColor: activeColor }}
                                                            >
                                                                {user.name[0]}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium">{user.name}</p>
                                                                <p className="text-xs text-gray-500">Corretor</p>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Color Picker Inline */}
                                                        {selectedEntityId === user.id && (
                                                          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                                                              <label className="text-xs text-gray-500 flex items-center gap-1">
                                                                  <Palette size={12}/> Cor no mapa
                                                              </label>
                                                              <input 
                                                                type="color" 
                                                                value={activeColor}
                                                                onChange={(e) => {
                                                                    const validPropId = currentProperty?.id
                                                                    if(!validPropId) return
                                                                    const currentColors = currentProperty?.agentColors || {}
                                                                    updateProperty(validPropId, {
                                                                        agentColors: { ...currentColors, [user.id]: e.target.value }
                                                                    })
                                                                }}
                                                                className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                                                              />
                                                          </div>
                                                        )}
                                                     </div>
                                                  )
                                             })}

                                             {/* List of Placed Agent Markers */}
                                             {(currentProperty?.agentMarkers?.length || 0) > 0 && (
                                                <div className="mt-6 pt-4 border-t border-gray-200">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <p className="text-xs font-bold text-gray-500 uppercase">Marcadores ({currentProperty?.agentMarkers?.length})</p>
                                                        <button 
                                                            onClick={() => updateProperty(currentProperty!.id, { agentMarkers: [] })}
                                                            className="text-[10px] text-red-600 hover:underline cursor-pointer"
                                                        >
                                                            Limpar Todos
                                                        </button>
                                                    </div>
                                                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                                        {currentProperty?.agentMarkers?.map((marker, idx) => {
                                                            const agent = users.find(u => u.id === marker.agentId)
                                                            return (
                                                                <div key={marker.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm hover:bg-gray-100">
                                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                                        <div 
                                                                            className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold" 
                                                                            style={{ backgroundColor: currentProperty?.agentColors?.[marker.agentId] || agent?.color || '#333' }}
                                                                        >
                                                                            {idx + 1}
                                                                        </div>
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="truncate text-gray-700 text-xs font-medium">
                                                                                {agent?.name || 'Desconhecido'}
                                                                            </span>
                                                                            <span className="text-gray-400 text-[10px]">({Math.round(marker.x)}%, {Math.round(marker.y)}%)</span>
                                                                        </div>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => handleRemoveMarker(marker.id, 'agent')}
                                                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                                                                        title="Remover este ponto"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                             )}
                                         </div>
                                     )}
                                 </div>
                             </div>
                         ) : selectedStoreId ? (
                            // --- SELECTED STORE VIEW ---
                             (() => {
                                 const selectedStore = stores.find(s => s.id === selectedStoreId)
                                 if (!selectedStore) return null
                                 
                                 return (
                                     <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
                                         {/* Header Image */}
                                         <div className="relative h-48 w-full bg-gray-100 shrink-0">
                                             {selectedStore.image ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={selectedStore.image} alt={selectedStore.name} className="w-full h-full object-cover" />
                                             ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <Store size={48} />
                                                </div>
                                             )}
                                             <button 
                                                onClick={() => setSelectedStoreId(null)}
                                                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full backdrop-blur-sm transition-colors"
                                             >
                                                <X size={16} />
                                             </button>
                                         </div>

                                         <div className="p-6 flex-1 overflow-y-auto">
                                             <div className="mb-4">
                                                 <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase mb-2">
                                                     {selectedStore.category}
                                                 </span>
                                                 <h2 className="text-2xl font-bold text-gray-900 leading-tight">{selectedStore.name}</h2>
                                             </div>

                                             <div className="grid grid-cols-2 gap-4 mb-6">
                                                 <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                     <p className="text-xs text-gray-400 uppercase font-bold mb-1">Área Total</p>
                                                     <p className="font-semibold text-gray-800">{selectedStore.area} m²</p>
                                                 </div>
                                                 <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                     <p className="text-xs text-gray-400 uppercase font-bold mb-1">Aluguel</p>
                                                     <p className="font-semibold text-gray-800">
                                                         {selectedStore.rentValue 
                                                            ? `R$ ${selectedStore.rentValue.toLocaleString()}` 
                                                            : 'Sob consulta'}
                                                     </p>
                                                 </div>
                                             </div>

                                             <div className="space-y-4">
                                                 <div>
                                                     <p className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                                                         <DollarSign size={16} className="text-green-600"/> Valor Mensal/m²
                                                     </p>
                                                     <p className="text-lg font-mono text-gray-600 pl-6">
                                                         R$ {selectedStore.rentValue && selectedStore.area ? (selectedStore.rentValue / selectedStore.area).toFixed(2) : '0,00'}
                                                     </p>
                                                 </div>

                                                 <div>
                                                     <p className="text-sm font-medium text-gray-700 mb-1">Gerente</p>
                                                     <p className="text-gray-600 pl-2 border-l-2 border-blue-200">{selectedStore.manager || 'Não informado'}</p>
                                                 </div>

                                                 <div>
                                                     <p className="text-sm font-medium text-gray-700 mb-1">Corretor Responsável</p>
                                                     <p className="text-gray-600 pl-2 border-l-2 border-purple-200">
                                                        {users.find(u => u.id === selectedStore.agentId)?.name || 'Não atribuído'}
                                                     </p>
                                                 </div>
                                             </div>

                                             <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-3">
                                                 <Link 
                                                    href={`/lojas?id=${selectedStore.id}`}
                                                    className="w-full btn-primary justify-center flex items-center gap-2"
                                                 >
                                                     <Maximize2 size={16} /> Ver Detalhes Completos
                                                 </Link>
                                             </div>
                                         </div>
                                     </div>
                                 )
                             })()
                         ) : (
                             // View Mode Sidebar (Default Generic View)
                             <div className="p-6">
                                 <h2 className="text-lg font-bold text-gray-900 mb-2">{currentProperty?.name}</h2>
                                 <p className="text-sm text-gray-500 mb-6">{currentProperty?.address}</p>
                                 
                                 <div className="space-y-4">
                                         <div className="bg-blue-50 p-4 rounded-lg">
                                             <p className="text-blue-800 font-medium text-sm">Resumo</p>
                                             <div className="mt-2 text-sm text-blue-900">
                                                 <div className="grid grid-cols-2 gap-2 mb-2">
                                                    <div>Lojas: {propertyStores.length}</div>
                                                    <div>Vagas: {storesWithoutMarkers.length}</div>
                                                 </div>
                                                 {hoveredStore && (
                                                     <div className="pt-2 border-t border-blue-200 mt-2">
                                                         <span className="font-bold">Em destaque:</span>
                                                         <p>{stores.find(s => s.id === hoveredStore)?.name}</p>
                                                     </div>
                                                 )}
                                             </div>
                                         </div>
                                     
                                     <div className="text-sm text-gray-500">
                                         <p className="mb-2 font-medium text-gray-700">Legenda:</p>
                                         <ul className="space-y-2">
                                             <li className="flex items-center gap-2">
                                                 <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                                 <span>Lojas Ocupadas</span>
                                             </li>
                                         </ul>

                                         {/* Dynamic Agent Legend */}
                                         {(currentProperty?.agentMarkers?.length || 0) > 0 && (
                                            <div className="mt-4 pt-2 border-t border-gray-100">
                                                <p className="mb-2 font-medium text-gray-700 text-xs">Corretores em campo:</p>
                                                <ul className="space-y-1">
                                                    {(() => {
                                                        const uniqueAgents = Array.from(new Set(currentProperty?.agentMarkers?.map(m => m.agentId) || []))
                                                        return uniqueAgents.map(agentId => {
                                                            const agent = users.find(u => u.id === agentId)
                                                            if (!agent) return null
                                                            const color = currentProperty?.agentColors?.[agentId] || agent.color || '#333'
                                                            return (
                                                                <li key={agentId} className="flex items-center gap-2 text-xs">
                                                                    <div 
                                                                        className="w-3 h-3 rounded-full shrink-0 shadow-sm" 
                                                                        style={{ backgroundColor: color }}
                                                                    />
                                                                    <span className="truncate">{agent.name}</span>
                                                                </li>
                                                            )
                                                        })
                                                    })()}
                                                </ul>
                                            </div>
                                         )}
                                     </div>
                                 </div>
                             </div>
                         )}
                    </div>
                )}
            </div>
        </div>
    )
}
