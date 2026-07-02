'use client'

import { useAppStore } from '@/lib/store'
import { Bell, Check, Trash2, AlertCircle, CheckCircle, Info } from 'lucide-react'

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: AlertCircle,
}

const typeColors = {
  info: 'bg-blue-50 border-blue-300',
  success: 'bg-green-50 border-green-300',
  warning: 'bg-yellow-50 border-yellow-300',
  error: 'bg-red-50 border-red-300',
}

const typeTextColors = {
  info: 'text-blue-800',
  success: 'text-green-800',
  warning: 'text-yellow-800',
  error: 'text-red-800',
}

export default function Notificacoes() {
  const { currentUser, notifications, markNotificationAsRead, removeNotification } = useAppStore()
  const userNotifications = notifications.filter(
    (n) => n.userId === currentUser?.id || n.userId === 'global'
  )

  const unread = userNotifications.filter((n) => !n.read)
  const read = userNotifications.filter((n) => n.read)

  const handleDeleteNotification = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta notificação?')) {
        removeNotification(id)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Notificações</h1>
        <p className="text-gray-600 mt-2">
          Você tem {unread.length} notificação
          {unread.length !== 1 ? 's não lida' : ' não lida'}
        </p>
      </div>

      {/* Unread Notifications */}
      {unread.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Não Lidas</h2>
          <div className="space-y-3">
            {unread.map((notification) => {
              const Icon = typeIcons[notification.type]
              return (
                <div
                  key={notification.id}
                  className={`border-l-4 p-4 rounded-lg ${
                    typeColors[notification.type]
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon
                        size={20}
                        className={`mt-1 flex-shrink-0 ${
                          typeTextColors[notification.type]
                        }`}
                      />
                      <div className="flex-1">
                        <h3
                          className={`font-semibold ${
                            typeTextColors[notification.type]
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <p className={`text-sm mt-1 ${typeTextColors[notification.type]}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.createdAt).toLocaleString(
                            'pt-BR'
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => markNotificationAsRead(notification.id)}
                      className="p-2 hover:bg-gray-200/50 rounded transition-colors flex-shrink-0"
                      title="Marcar como lida"
                    >
                      <Check size={18} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Read Notifications */}
      {read.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Lidas</h2>
          <div className="space-y-3">
            {read.map((notification) => {
              const Icon = typeIcons[notification.type]
              return (
                <div
                  key={notification.id}
                  className="bg-gray-50 border border-gray-200 p-4 rounded-lg opacity-75"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon size={20} className="mt-1 flex-shrink-0 text-gray-400" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-600">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.createdAt).toLocaleString(
                            'pt-BR'
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="p-2 hover:bg-red-50 hover:text-red-600 rounded transition-colors flex-shrink-0"
                      title="Deletar notificação"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {userNotifications.length === 0 && (
        <div className="text-center py-12">
          <Bell size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Nenhuma notificação</p>
        </div>
      )}
    </div>
  )
}
