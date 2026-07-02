'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Save, MessageSquare } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'http://localhost:3001'

interface UraOption {
    id: string
    label: string
    action: 'transfer' | 'message'
    dept?: string
    message: string
}

interface UraConfig {
    greeting: string
    fallback: string
    options: UraOption[]
}

const DEFAULT_CONFIG: UraConfig = {
    greeting: "Bem vindo ao Shopping! Escolha:",
    fallback: "Opção inválida",
    options: []
}

export default function UraBuilderPage() {
    const [config, setConfig] = useState<UraConfig>(DEFAULT_CONFIG)
    const [isConnected, setIsConnected] = useState(false)
    const [statusMsg, setStatusMsg] = useState('')
    const socketRef = useRef<Socket | null>(null)

    // Conectar ao Broker para pegar/salvar config
    useEffect(() => {
        const socket = io(SOCKET_URL, { autoConnect: true })
        socketRef.current = socket

        socket.on('connect', () => {
            setIsConnected(true)
            // Pede a config atual assim que conecta
            socket.emit('get_ura_config')
        })

        socket.on('ura_config_current', (currentConfig: UraConfig) => {
            setConfig(currentConfig)
        })

        socket.on('disconnect', () => setIsConnected(false))

        return () => { socket.disconnect() }
    }, [])

    const handleSave = () => {
        if (!socketRef.current) return
        socketRef.current.emit('update_ura_config', config)
        setStatusMsg('Configuração salva e aplicada no Robô com sucesso!')
        setTimeout(() => setStatusMsg(''), 3000)
    }

    const addOption = () => {
        const newId = (config.options.length + 1).toString()
        setConfig(prev => ({
            ...prev,
            options: [...prev.options, { id: newId, label: 'Nova Opção', action: 'message', message: '' }]
        }))
    }

    const updateOption = (index: number, field: keyof UraOption, value: string) => {
        const newOpts = [...config.options]
        newOpts[index] = { ...newOpts[index], [field]: value }
        setConfig(prev => ({ ...prev, options: newOpts }))
    }

    const removeOption = (index: number) => {
        const newOpts = config.options.filter((_, i) => i !== index)
        setConfig(prev => ({ ...prev, options: newOpts }))
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Construtor de URA (WhatsApp Bot)</h1>
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-500">{isConnected ? 'Broker Conectado' : 'Broker Offline'}</span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow border border-slate-200 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare size={20} className="text-blue-600" />
                    Mensagem de Saudação
                </h2>
                <textarea 
                    className="w-full p-3 border border-gray-300 rounded-lg h-32 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={config.greeting}
                    onChange={(e) => setConfig({...config, greeting: e.target.value})}
                    placeholder="Ex: Olá, bem vindo ao Shopping..."
                />
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-700">Opções do Menu Principal</h2>
                {config.options.map((opt, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4 items-start relative animate-in fade-in slide-in-from-left-4">
                        <div className="bg-slate-100 w-10 h-10 flex items-center justify-center rounded-lg font-bold text-slate-600 shrink-0">
                            {opt.id}
                        </div>
                        
                        <div className="flex-1 space-y-3">
                            <div className="flex gap-3">
                                <input 
                                    type="text" 
                                    value={opt.label} 
                                    onChange={(e) => updateOption(idx, 'label', e.target.value)}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm font-semibold"
                                    placeholder="Rótulo do Botão (Ex: Comercial)"
                                />
                                <div className="flex items-center gap-2 bg-gray-50 px-3 rounded border border-gray-200">
                                    <span className="text-xs text-gray-500">Ação:</span>
                                    <select 
                                        value={opt.action}
                                        onChange={(e) => updateOption(idx, 'action', e.target.value as any)}
                                        className="bg-transparent text-sm text-slate-700 outline-none cursor-pointer"
                                    >
                                        <option value="transfer">Transferir p/ Humano</option>
                                        <option value="message">Apenas Responder</option>
                                    </select>
                                </div>
                            </div>

                            {opt.action === 'transfer' ? (
                                <div className="flex gap-3 animate-in fade-in">
                                    <input 
                                        type="text" 
                                        value={opt.dept || ''}
                                        onChange={(e) => updateOption(idx, 'dept', e.target.value)}
                                        className="flex-1 border border-orange-200 bg-orange-50 rounded px-3 py-2 text-sm" 
                                        placeholder="Nome do Departamento (Ex: Comercial)"
                                    />
                                    <input 
                                        type="text" 
                                        value={opt.message}
                                        onChange={(e) => updateOption(idx, 'message', e.target.value)}
                                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" 
                                        placeholder="Msg de Transferência (Ex: Aguarde...)"
                                    />
                                </div>
                            ) : (
                                <textarea
                                    value={opt.message}
                                    onChange={(e) => updateOption(idx, 'message', e.target.value)}
                                    className="w-full border border-blue-200 bg-blue-50 rounded px-3 py-2 text-sm h-20 animate-in fade-in"
                                    placeholder="Resposta Automática (Ex: Nosso endereço é...)"
                                />
                            )}
                        </div>

                        <button 
                            onClick={() => removeOption(idx)}
                            className="bg-red-50 hover:bg-red-100 text-red-500 p-2 rounded-lg transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                <button 
                    onClick={addOption}
                    className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium"
                >
                    <Plus size={20} />
                    Adicionar Opção
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
                <h2 className="text-lg font-semibold mb-2">Mensagem de Erro (Fallback)</h2>
                <input 
                    type="text"
                    value={config.fallback}
                    onChange={(e) => setConfig({...config, fallback: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
            </div>

            <div className="fixed bottom-6 right-6 flex flex-col gap-2">
                {statusMsg && (
                    <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4">
                        {statusMsg}
                    </div>
                )}
                <button 
                    onClick={handleSave}
                    disabled={!isConnected}
                    className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-full shadow-xl flex items-center gap-3 font-bold text-lg transition-transform hover:scale-105"
                >
                    <Save size={24} />
                    Salvar e Aplicar
                </button>
            </div>
        </div>
    )
}
