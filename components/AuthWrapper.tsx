'use client'

import { useAppStore, DEFAULT_PERMISSIONS_USER, DEFAULT_PERMISSIONS_ADMIN, UserPermissions } from '@/lib/store'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileTabBar from './MobileTabBar'

interface AuthWrapperProps {
  children: ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { currentUser, isInitialized } = useAppStore()
  const pathname = usePathname()
  const router = useRouter()

  // Normalizar pathname para evitar problemas com trailing slashes
  const normalizedPath = pathname?.replace(/\/$/, '') || '/'
  const isLoginPage = normalizedPath === '/login'
  const isProtectedPage = !isLoginPage

  console.log('AuthWrapper:', { pathname, normalizedPath, isLoginPage, isInitialized, hasUser: !!currentUser })

  // Redirecionar baseado em auth
  useEffect(() => {
    // Só redireciona se o store já foi inicializado com dados do localStorage
    if (!isInitialized) return

    if (isProtectedPage && !currentUser) {
      console.log('Redirecionando para login...')
      router.replace('/login')
    } else if (isLoginPage && currentUser) {
      console.log('Redirecionando para home...')
      router.replace('/')
    } else if (currentUser && isProtectedPage) {
      // Permission Check
      const permissions = currentUser.permissions || 
        (currentUser.role === 'admin' ? DEFAULT_PERMISSIONS_ADMIN : DEFAULT_PERMISSIONS_USER);

      const permissionMap: Record<string, keyof UserPermissions> = {
        '/': 'overview',
        '/relatorios': 'relatorios',
        '/planta-baixa': 'plantaBaixa',
        '/lojas': 'lojas',
        '/calendario': 'calendario',
        '/tarefas': 'tarefas',
        '/cadastros': 'cadastros',
        '/corretores': 'corretores',
        '/notificacoes': 'notificacoes',
      }

      // Find most specific matching path
      const matchingPath = Object.keys(permissionMap)
        .filter(path => normalizedPath === path || (path !== '/' && normalizedPath.startsWith(path + '/')))
        .sort((a, b) => b.length - a.length)[0];

      if (matchingPath) {
        const key = permissionMap[matchingPath];
        if (permissions[key] === 'none') {
           console.log('Acesso negado ao módulo:', key);
           router.replace('/');
        }
      }
    }
  }, [currentUser, isLoginPage, isProtectedPage, router, isInitialized, normalizedPath])

  // Na página de login
  if (isLoginPage) {
    // Se ainda não inicializou, mostrando loading discreto
    if (!isInitialized) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Iniciando sistema...</div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {children}
      </div>
    )
  }

  // Em páginas protegidas sem usuário ou não inicializado
  if (!isInitialized || (!currentUser && isProtectedPage)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">
            {!isInitialized ? 'Carregando recursos...' : 'Verificando permissões...'}
          </p>
        </div>
      </div>
    )
  }

  // Se houver usuário e estiver inicializado
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar hidden on mobile (handled by Sidebar component classes) */}
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Header />
        {/* Adicionado padding-bottom para não esconder conteúdo atrás da TabBar no mobile */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            {children}
        </main>
        
        {/* Nova Barra de Navegação Mobile */}
        <MobileTabBar />
      </div>
    </div>
  )
}
