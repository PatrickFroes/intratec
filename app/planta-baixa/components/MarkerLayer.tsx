'use client'

import { AgentMarker, Store, StoreMarker, User } from '@/lib/store'

// Optimized Marker Component
export const MarkerLayer = ({ 
    storeMarkers, 
    agentMarkers, 
    stores, 
    users, 
    scale, 
    onStoreClick, 
    onStoreHover, 
    isAdmin, 
    currentUserId,
    agentColors
}: {
    storeMarkers: StoreMarker[]
    agentMarkers: AgentMarker[]
    stores: Store[]
    users: User[]
    scale: number
    onStoreClick: (storeId: string) => void
    onStoreHover: (storeId: string | null) => void
    isAdmin: boolean
    currentUserId: string
    agentColors?: Record<string, string>
}) => {
    
    // Performance: Filter visible agent markers once
    const visibleAgentMarkers = agentMarkers.filter(m => {
        if (isAdmin) return true
        return m.agentId === currentUserId
    })

    return (
        <>
            {/* Store Markers (Pins) */}
            {storeMarkers.map((marker) => {
                const store = stores.find(s => s.id === marker.storeId)
                if (!store) return null
                
                // Color based on Agent (Corretor Responsável)
                const agentId = store.agentId
                const agent = agentId ? users.find(u => u.id === agentId) : null
                // Use property-specific override, then agent default color, then fallback to blue
                const color = (agentId && (agentColors?.[agentId] || agent?.color)) || '#3B82F6'

                return (
                    <div
                        key={marker.storeId}
                        style={{
                            position: 'absolute',
                            left: `${marker.x}%`,
                            top: `${marker.y}%`,
                            transform: `translate(-50%, -100%) scale(${1 / scale})`, // Counter-scale to keep pin size constant? No, let it zoom.
                            // Actually, let's keep pins consistent size visually by inversely scaling? 
                            // Standard google maps behavior: pins stay same size. 
                            // But here simpler to let them zoom or use fixed size. 
                            // Let's stick to standard flow but adding 'pointer-events-auto'
                            cursor: 'pointer',
                            zIndex: 10
                        }}
                        onClick={(e) => {
                            e.stopPropagation()
                            onStoreClick(store.id)
                        }}
                        onMouseEnter={() => onStoreHover(store.id)}
                        onMouseLeave={() => onStoreHover(null)}
                    >
                         {/* CSS-only Pin for better performance than SVG icons everywhere */}
                         <div className="flex flex-col items-center group transition-transform hover:scale-110">
                            <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg border-2 border-white"
                                style={{ backgroundColor: color }}
                            >
                                {store.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div 
                                className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]"
                                style={{ borderTopColor: color }}
                            ></div>
                         </div>
                    </div>
                )
            })}

            {/* Agent Markers */}
            {visibleAgentMarkers.map((marker) => {
                const agent = users.find(u => u.id === marker.agentId)
                if (!agent) return null
                
                const color = agentColors?.[agent.id] || agent.color || '#333'
                // Find index in original list for consistent numbering with sidebar
                const number = agentMarkers.findIndex(m => m.id === marker.id) + 1

                return (
                    <div
                        key={marker.id}
                        style={{
                            position: 'absolute',
                            left: `${marker.x}%`,
                            top: `${marker.y}%`,
                            transform: 'translate(-50%, -100%)',
                            cursor: 'pointer',
                            zIndex: 20
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center hover:scale-110 transition-transform">
                             <div className="relative pointer-events-none">
                                 {/* Custom Solid Pin SVG to avoid the "hole" in the center */}
                                 <svg 
                                    width="32" 
                                    height="32" 
                                    viewBox="0 0 24 24" 
                                    fill={color} 
                                    stroke="white" 
                                    strokeWidth="1.5" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    className="drop-shadow-lg"
                                 >
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                 </svg>
                                 <div className="absolute top-0 left-0 w-full h-[32px] flex items-center justify-center -mt-[4px]">
                                    <span className="text-[12px] font-bold text-white block">
                                        {number}
                                    </span>
                                 </div>
                             </div>
                        </div>
                    </div>
                )
            })}
        </>
    )
}
