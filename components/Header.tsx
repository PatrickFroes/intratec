'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAppStore, Client, Store, Property } from '@/lib/store'
import { Bell, LogOut, Search, Building2, Users, Store as StoreIcon, Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Header() {
  const { currentUser, notifications, logout, clients, stores, properties, toggleSidebar } = useAppStore()
  const router = useRouter()
  // Filter notifications for the current user only
  const userNotifications = notifications.filter(n => n.userId === currentUser?.id)
  const unreadNotifications = userNotifications.filter((n) => !n.read).length
  
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{
    clients: Client[],
    stores: Store[],
    properties: Property[]
  }>({ clients: [], stores: [], properties: [] })
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Get User Initials
  const getInitials = (name: string) => {
     return name
         .split(' ')
         .map((n) => n[0])
         .slice(0, 2)
         .join('')
         .toUpperCase();
  }

  // Handle Search Logic
  useEffect(() => {
    if (query.trim().length === 0) {
      setSearchResults({ clients: [], stores: [], properties: [] })
      return
    }

    const lowerQuery = query.toLowerCase()

    const filteredClients = clients.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) || 
      c.email.toLowerCase().includes(lowerQuery) ||
      c.document.includes(lowerQuery)
    ).slice(0, 5)

    const filteredStores = stores.filter(s => 
      s.name.toLowerCase().includes(lowerQuery) ||
      s.category.toLowerCase().includes(lowerQuery)
    ).slice(0, 5)

    const filteredProperties = properties.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.city.toLowerCase().includes(lowerQuery)
    ).slice(0, 5)

    setSearchResults({
      clients: filteredClients,
      stores: filteredStores,
      properties: filteredProperties
    })
  }, [query, clients, stores, properties])

  // Close search on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [searchRef])

  const hasResults = searchResults.clients.length > 0 || searchResults.stores.length > 0 || searchResults.properties.length > 0

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200/60 px-4 lg:px-8 py-4 flex justify-between items-center transition-all bg-opacity-95">
      
      {/* Mobile Menu Button */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-100 rounded-lg"
      >
        <Menu size={24} />
      </button>

      <div className="flex-1 max-w-xl">
        <div className="relative group" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
                type="text" 
                placeholder="Pesquisar lojas, clientes, empreendimentos..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setShowResults(true)
                }}
                onFocus={() => setShowResults(true)}
            />

            {/* Search Results Dropdown */}
            {showResults && query.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 max-h-[80vh] overflow-y-auto overflow-x-hidden z-20">
                {!hasResults ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    Nenhum resultado encontrado para &quot;{query}&quot;
                  </div>
                ) : (
                  <div className="py-2">
                    {/* Clientes */}
                    {searchResults.clients.length > 0 && (
                      <div className="mb-2">
                        <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Users size={12} />
                          Clientes
                        </div>
                        {searchResults.clients.map(client => (
                          <button
                            key={client.id}
                            onClick={() => {
                              router.push(`/clientes?id=${client.id}`)
                              setShowResults(false)
                              setQuery('')
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between group"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-700 group-hover:text-blue-600">{client.name}</p>
                              <p className="text-xs text-slate-400">{client.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Lojas */}
                    {searchResults.stores.length > 0 && (
                      <div className="mb-2">
                        <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <StoreIcon size={12} />
                          Lojas
                        </div>
                        {searchResults.stores.map(store => (
                          <button
                            key={store.id}
                            onClick={() => {
                              router.push(`/lojas?id=${store.id}`)
                              setShowResults(false)
                              setQuery('')
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between group"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-700 group-hover:text-blue-600">{store.name}</p>
                              <p className="text-xs text-slate-400">{store.category}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Empreendimentos */}
                    {searchResults.properties.length > 0 && (
                      <div className="mb-2">
                         <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Building2 size={12} />
                          Empreendimentos
                        </div>
                        {searchResults.properties.map(property => (
                          <button
                            key={property.id}
                            onClick={() => {
                              router.push(`/empreendimentos?id=${property.id}`) 
                              setShowResults(false)
                              setQuery('')
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between group"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-700 group-hover:text-blue-600">{property.name}</p>
                              <p className="text-xs text-slate-400">{property.city}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={() => router.push('/notificacoes')}
          className="relative p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <Bell size={20} />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 border-2 border-white text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadNotifications}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-slate-200"></div>

        <div className="flex items-center gap-4 pl-2">
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-none">{currentUser?.name}</p>
              <p className="text-xs text-slate-500 capitalize mt-1">{currentUser?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm text-blue-700 font-bold text-sm">
                {currentUser?.name ? getInitials(currentUser.name) : 'US'}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sair do sistema"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}