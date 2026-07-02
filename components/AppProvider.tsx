'use client'

import React, { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { 
    setInitialized, 
    setCurrentUser, 
    fetchUsers, 
    fetchProperties, 
    fetchClients,
    fetchStores,
    fetchTasks,
    fetchEvents,
    fetchNotifications 
  } = useAppStore()

  useEffect(() => {
    // Sincronizar dados do DynamoDB quando monta
    if (typeof window === 'undefined') return

    const initApp = async () => {
      try {
        // 1. Carregar sessão local (só para manter usuário logado sem bater no banco p/ auth)
        // Em um app real, validaríamos o token de sessão aqui
        const storedUser = localStorage.getItem('shopping-intranet:currentUser')
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser))
        }

        // 2. Carregar dados do Banco em paralelo
        await Promise.all([
          fetchUsers(),
          fetchProperties(),
          fetchClients(),
          fetchStores(),
          fetchTasks(),
          fetchEvents(),
          fetchNotifications()
        ])
        
        // 3. Marcar como pronto
        setInitialized(true)
      } catch (error) {
        console.error('Erro ao inicializar dados do DynamoDB:', error)
        // Inicializa mesmo com erro para não travar a UI (mostrará listas vazias)
        setInitialized(true) 
      }
    }

    initApp()
  }, [
    setInitialized, 
    setCurrentUser, 
    fetchUsers, 
    fetchProperties, 
    fetchClients, 
    fetchStores, // Added fetchStores
    fetchTasks,
    fetchEvents,
    fetchNotifications
  ])

  return <>{children}</>
}

