'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Paperclip } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'http://localhost:3001'

// Interface de Mensagem
interface ChatMessage {
    id: string | number
    text: string
    sender: 'me' | 'them'
    time?: string
}

// Interface de Chat
interface ChatContact {
    id: string
    name: string
    phone: string // Importante para mandar mensagem
    lastMsg: string
    time: string
    unread: number
    assignedName?: string
    assignedTo?: string
}

// Mock Users para simulação de permissão (no sistema real viria do Auth)
const SYSTEM_USERS = [
    { id: 'admin', name: 'Supervisão (Ver Tudo)', role: 'admin' },
    { id: 'agent1', name: 'João (Comercial)', role: 'agent' },
    { id: 'agent2', name: 'Maria (Financeiro)', role: 'agent' },
]

export default function WhatsAppEmbed() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(SYSTEM_USERS[0]) // Usuário logado simulado
  
  const [isConnected, setIsConnected] = useState(false)
  const [activeChat, setActiveChat] = useState<ChatContact | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [chats, setChats] = useState<ChatContact[]>([])
  
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Filtra os chats baseado no usuário logado
  const filteredChats = chats.filter(chat => {
      if (currentUser.role === 'admin') return true; // Admin vê tudo
      // Se não tem dono (ainda no bot) ou é meu
      // @ts-ignore
      return !chat.assignedTo || chat.assignedTo === currentUser.id; 
  })

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen, activeChat])

  // Inicializar Socket.io
  useEffect(() => {
    // Conecta ao nosso broker local na porta 3001
    const socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true
    })

    socketRef.current = socket

    socket.on('connect', () => {
        console.log('Connectado ao Broker WhatsApp')
        setIsConnected(true)
    })

    socket.on('disconnect', () => {
        console.log('Desconectado do Broker')
        setIsConnected(false)
    })
    
    // Escuta atribuição de tickets
    socket.on('ticket_assigned', (data: any) => {
        console.log('Ticket Atribuído:', data);
        setChats(prev => prev.map(c => {
            if (data.chatId.includes(c.phone)) {
                return { ...c, assignedTo: data.agentId, assignedName: data.agentName } as any
            }
            return c
        }))
    });

    // Recebendo mensagens reais do servidor
    socket.on('message_received', (data: any) => {
        // Toca um som de notificação (opcional)
        // const audio = new Audio('/notification.mp3'); audio.play();

        // Se for do chat aberto, adiciona na lista (corrigido para comparar números corretamente)
        if (activeChat && (data.from.replace('@c.us', '') === activeChat.phone || activeChat.phone === 'geral')) {
             setMessages(prev => [...prev, {
                 id: data.id,
                 text: data.text,
                 sender: 'them',
                 time: data.time
             }])
        }

        // Atualiza a lista de chats
        setChats(prev => {
            const existing = prev.find(c => data.from.includes(c.phone))
            if (existing) {
                return prev.map(c => c.id === existing.id ? {
                    ...c, 
                    lastMsg: data.text, 
                    time: data.time,
                    unread: (activeChat?.id === c.id) ? 0 : c.unread + 1,
                    // Atualiza info do ticket se vier
                    assignedTo: data.ticketInfo?.assignedTo || (c as any).assignedTo, 
                    assignedName: data.ticketInfo?.dept || (c as any).assignedName
                } as any : c)
            } else {
                return [{
                    id: data.from,
                    name: data.name || data.from,
                    phone: data.from.replace('@c.us', ''),
                    lastMsg: data.text,
                    time: data.time,
                    unread: 1,
                    assignedTo: data.ticketInfo?.assignedTo, // Quem está cuidando
                    assignedName: data.ticketInfo?.dept
                } as any, ...prev]
            }
        })
    })

    return () => {
        socket.disconnect()
    }
  }, [activeChat])

  const toggleOpen = () => setIsOpen(!isOpen)

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChat || !socketRef.current) return

    const msgData = {
        id: Date.now(),
        text: newMessage,
        sender: 'me' as const,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }

    setMessages(prev => [...prev, msgData])
    
    // ENVIA PARA O SERVIDOR NODE REAL
    socketRef.current.emit('send_message', {
        phone: activeChat.phone,
        text: newMessage
    })

    setNewMessage('')
  }


  if (!isOpen) {
    return (
      <button 
        onClick={toggleOpen}
        className={`fixed bottom-24 right-6 z-50 ${isConnected ? 'bg-[#25D366] hover:bg-[#20bd5a]' : 'bg-gray-400'} text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center group`}
        title={isConnected ? "Abrir WhatsApp" : "WhatsApp Desconectado (Rode o servidor Broker)"}
      >
        <MessageCircle size={28} />
        {isConnected && (
            <span className="absolute right-0 top-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[350px] md:w-[800px] h-[500px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="bg-[#00a884] text-white p-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
            <MessageCircle size={20} />
            <div className="flex flex-col">
                <span className="font-semibold text-sm leading-tight">WhatsApp Intranet</span>
                <span className="text-[10px] text-green-100 flex items-center gap-1">
                    {isConnected ? <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"/> : <span className="w-1.5 h-1.5 bg-red-400 rounded-full"/>}
                    {isConnected ? 'Online' : 'Servidor Offline'}
                </span>
            </div>
        </div>
        <button onClick={toggleOpen} className="hover:bg-white/20 p-1 rounded-full text-white">
            <X size={20} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden bg-[#e9edef]">
        
        {/* Sidebar (Chat List) */}
        <div className={`w-full md:w-1/3 bg-white border-r border-gray-200 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-2 bg-gray-50 border-b border-gray-200 space-y-2">
                 {/* SIMULAÇÃO DE TROCA DE USUÁRIO */}
                 <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-yellow-50 p-1 rounded border border-yellow-100">
                    <span>👤 Visão:</span>
                    <select 
                        className="bg-transparent font-bold text-yellow-800 focus:outline-none w-full"
                        value={currentUser.id}
                        onChange={(e) => setCurrentUser(SYSTEM_USERS.find(u => u.id === e.target.value) || SYSTEM_USERS[0])}
                    >
                        {SYSTEM_USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>

                <input type="text" placeholder="Pesquisar conversa..." className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#00a884]" />
            </div>
            
            {!isConnected && (
                <div className="p-4 text-center text-xs text-red-500 bg-red-50">
                    Broker desconectado. Rode <b>iniciar-whatsapp.bat</b>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {filteredChats.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-xs">
                        {isConnected 
                            ? (currentUser.role === 'admin' ? "Nenhuma conversa ativa." : "Nenhum chamado atribuído a você.")
                            : "Aguardando conexão..."}
                    </div>
                )}
                {filteredChats.map(chat => (
                    <div 
                        key={chat.id} 
                        onClick={() => setActiveChat(chat)}
                        className={`p-3 border-b border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${activeChat?.id === chat.id ? 'bg-gray-100' : ''}`}
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold relative">
                            {chat.name[0]}
                            {chat.assignedTo && <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[8px] text-white" title={chat.assignedName}>👤</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                                <h4 className="font-semibold text-sm text-gray-800 truncate">{chat.name}</h4>
                                <span className="text-[10px] text-gray-500">{chat.time}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{chat.lastMsg}</p>
                            
                            {chat.assignedName && (
                                <div className="mt-1 flex items-center gap-1">
                                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                                        {chat.assignedName}
                                    </span>
                                </div>
                            )}
                        </div>
                        {chat.unread > 0 && (
                            <span className="w-5 h-5 rounded-full bg-[#25D366] text-white text-[10px] font-bold flex items-center justify-center">
                                {chat.unread}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Right Panel: Chat Area */}
        <div className={`flex-1 flex flex-col bg-[#efeae2] bg-opacity-50 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
            {activeChat ? (
                <>
                    {/* Chat Header on Mobile */}
                    <div className="bg-[#f0f2f5] p-2 flex items-center gap-2 border-b border-gray-200 md:hidden">
                        <button onClick={() => setActiveChat(null)} className="text-[#00a884] text-xs font-bold">Voltar</button>
                        <span className="font-semibold text-sm text-gray-700">{activeChat.name}</span>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: '400px' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg px-3 py-1.5 shadow-sm text-sm relative ${
                                    msg.sender === 'me' ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
                                }`}>
                                    {msg.text}
                                    <span className="text-[10px] text-gray-500 block text-right mt-1 ml-4">{msg.time}</span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="bg-[#f0f2f5] p-2 flex items-center gap-2">
                         <button type="button" className="text-gray-500 hover:text-gray-700 p-2">
                            <Paperclip size={20} />
                         </button>
                         <input 
                            type="text" 
                            className="flex-1 rounded-lg border-0 px-4 py-2 text-sm focus:ring-0" 
                            placeholder="Digite uma mensagem"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button type="submit" disabled={!newMessage.trim()} className="text-[#54656f] disabled:opacity-50 hover:bg-gray-200 p-2 rounded-full">
                            <Send size={20} />
                        </button>
                    </form>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center bg-[#f0f2f5] h-full border-b-[6px] border-[#25D366]">
                    <MessageCircle size={48} className="mb-4 text-slate-300" />
                    <h3 className="font-light text-xl text-gray-700 mb-2">WhatsApp Web Integrado</h3>
                    <p className="text-sm">Selecione uma conversa para começar o atendimento.</p>
                </div>
            )}
        </div>

      </div>
    </div>
  )
}
