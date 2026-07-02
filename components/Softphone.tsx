'use client'

import { useFive9Store } from '@/lib/five9-store'
import { Phone, PhoneOff, MicOff, Hash } from 'lucide-react'
import { useState } from 'react'

/**
 * Componente Softphone (Legado/Opcional)
 * 
 * Este componente fornece uma interface de UI personalizada para fazer e receber chamadas
 * utilizando o estado global do Five9. Ele funciona como uma alternativa ou complemento
 * à interface nativa do iframe (Five9Adapter).
 * 
 * Funcionalidades:
 * - Exibição de estado da chamada (Ocioso, Discando, Falando).
 * - Discador numérico.
 * - Controles de chamada (Atender, Desligar, Mudo - Visual apenas).
 */
export default function Softphone() {
    // Acesso à store global para interagir com o SDK do Five9
    const { 
        callState, 
        activeNumber, 
        makeCall, 
        hangupCall, 
        isInitialized 
    } = useFive9Store()

    // Estado local para controle da UI (Expandido/Colapsado e Input de Discagem)
    const [isExpanded, setIsExpanded] = useState(false)
    const [dialNumber, setDialNumber] = useState('')

    /**
     * Gerencia a submissão do formulário de discagem.
     * Previne o reload da página e invoca a ação de discagem na store.
     */
    const handleCall = (e: React.FormEvent) => {
        e.preventDefault()
        if(dialNumber) makeCall(dialNumber)
    }

    // Renderização Condicional: Modo Miniatura (Barra de status flutuante)
    if (!isExpanded) {
        return (
            <div 
                onClick={() => setIsExpanded(true)}
                className={`fixed bottom-4 right-4 z-50 p-4 rounded-full shadow-lg cursor-pointer transition-all hover:scale-105 flex items-center gap-2
                    ${callState === 'RINGING' ? 'bg-red-500 animate-pulse text-white' : 
                      callState === 'ACTIVE' ? 'bg-green-600 text-white' : 
                      'bg-slate-900 text-slate-300'}`}
                title="Expandir Telefone"
            >
                {/* Ícone muda baseado no estado da chamada */}
                {callState === 'RINGING' ? <PhoneOff className="animate-bounce" /> : <Phone />}
                
                {/* Mostra o número ativo se não estiver ocioso */}
                {callState !== 'IDLE' && (
                    <span className="font-bold text-sm max-w-[100px] truncate">
                        {activeNumber}
                    </span>
                )}
            </div>
        )
    }

    // Renderização Condicional: Modo Expandido (Interface Completa)
    return (
        <div className="fixed bottom-4 right-4 z-50 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5">
            {/* Cabeçalho da Janela */}
            <div className={`p-4 flex justify-between items-center ${
                callState === 'ACTIVE' ? 'bg-green-600' : 'bg-slate-900'
            } text-white`}>
                <div className="flex items-center gap-2">
                    {/* Indicador de Status de Conexão (Login) */}
                    <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="font-semibold text-sm">
                        {isInitialized ? 'Five9 Conectado' : 'Desconectado'}
                    </span>
                </div>
                {/* Botão de Minimizar */}
                <button 
                    onClick={() => setIsExpanded(false)}
                    className="hover:bg-white/20 rounded p-1"
                    title="Minimizar para barra"
                >
                    <span className="sr-only">Minimizar</span>
                    <div className="w-4 h-0.5 bg-white"></div>
                </button>
            </div>

            {/* Display de Status da Chamada */}
            <div className="p-6 text-center bg-gray-50 border-b border-gray-100">
                {callState === 'IDLE' && (
                    <div className="text-gray-400 text-sm">Pronto para chamar</div>
                )}
                {callState === 'RINGING' && (
                    <div className="animate-pulse">
                        <p className="text-red-500 font-bold mb-1">Chamada Entrando...</p>
                        <h3 className="text-2xl font-bold text-gray-800">{activeNumber}</h3>
                    </div>
                )}
                {callState === 'ACTIVE' && (
                    <div>
                        <p className="text-green-600 font-bold mb-1">Em Chamada</p>
                        <h3 className="text-2xl font-bold text-gray-800">{activeNumber}</h3>
                        <p className="text-gray-400 font-mono mt-2">00:00</p>
                    </div>
                )}
            </div>

            {/* Área de Ações: Teclado ou Controles de Chamada */}
            <div className="p-4">
                {callState === 'IDLE' ? (
                    // Formulário de Discagem
                    <form onSubmit={handleCall}>
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="tel" 
                                className="w-full bg-gray-100 border-none rounded-lg px-4 py-2 text-lg font-mono focus:ring-2 focus:ring-blue-500"
                                placeholder="Digite o número"
                                value={dialNumber}
                                onChange={e => setDialNumber(e.target.value)}
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={!isInitialized || !dialNumber}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Phone size={20} /> Discar
                        </button>
                    </form>
                ) : (
                    // Controles em Chamada (Mudo, Teclado, Desligar)
                    <div className="grid grid-cols-3 gap-3">
                        <button className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 flex justify-center text-gray-600" title="Mudo (Simulado)">
                            <MicOff size={20} />
                        </button>
                        <button className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 flex justify-center text-gray-600" title="Teclado Numérico">
                             <Hash size={20} />
                        </button>
                        <button 
                            onClick={hangupCall}
                            className="p-3 rounded-full bg-red-500 hover:bg-red-600 flex justify-center text-white"
                            title="Desligar"
                        >
                            <PhoneOff size={20} />
                        </button>
                    </div>
                )}
            </div>
            
            {/* Aviso de Login Necessário */}
            {!isInitialized && (
                <div className="bg-amber-50 p-2 text-center text-xs text-amber-600 border-t border-amber-100">
                    Faça login no Five9 para ativar.
                </div>
            )}
        </div>
    )
}
