'use client'

import Script from 'next/script'
import { useFive9Store } from '@/lib/five9-store'
import { useState, useRef, useEffect } from 'react'
import { Minimize2, Phone } from 'lucide-react'

/**
 * Componente Five9Adapter
 * 
 * Gerencia a integração com o Five9 Agent Desktop Toolkit (ADT).
 * Controla o ciclo de vida do iframe, inscrições em eventos e o estado de alternância da UI.
 * 
 * Nota: O iframe deve permanecer montado no DOM para manter a conexão WebSocket
 * ativa. A visibilidade é controlada visualmente.
 */
export default function Five9Adapter() {
    const { isInitialized, setInitialized, setAgentState, setCallState, setActiveNumber } = useFive9Store()
    const [isOpen, setIsOpen] = useState(false)
    const hasInited = useRef(false)
    
    // Constantes de Integração Five9
    const FIVE9_DOMAIN = 'app.five9.com'
    const ADT_URL = `https://${FIVE9_DOMAIN}/clients/integrations/adt.main.html` 

    /**
     * Inicializa o Five9 CRM SDK
     * Tenta novamente automaticamente se a biblioteca ainda não estiver carregada.
     */
    const initializeSDK = (attempts = 0) => {
        if (hasInited.current) {
            return
        }

        // @ts-ignore - window.Five9 é injetado pelo script externo
        if (window.Five9 && window.Five9.CrmSdk) {
            console.log('[Five9] SDK detectado, inicializando...')
            try {
                // @ts-ignore
                window.Five9.CrmSdk.init({
                    debug: true 
                });
                
                hasInited.current = true; 

                // Inscrever-se em eventos do SDK para sincronizar o estado da aplicação local
                // @ts-ignore
                const eventApi = window.Five9.CrmSdk.eventApi();
                
                eventApi.subscribe((event: any) => {
                     console.debug('[Five9] Evento:', event.type, event.data);
                    
                    switch(event.type) {
                        case 'interactionOffered':
                            setCallState('RINGING');
                            setActiveNumber(event.data?.ani || 'Desconhecido');
                            // Expandir automaticamente a interface em chamadas recebidas
                            if (!isOpen) setIsOpen(true); 
                            break;
                            
                        case 'interactionAccepted':
                        case 'interactionConnected':
                            setCallState('ACTIVE');
                            break;
                            
                        case 'interactionEnded':
                            setCallState('IDLE');
                            setActiveNumber(null);
                            break;
                            
                        case 'loginSuccess':
                            setAgentState('READY');
                            setInitialized(true);
                            // Minimizar automaticamente após login bem-sucedido para economizar espaço na tela
                            setIsOpen(false); 
                            break;
                            
                        case 'loggedOut':
                            setAgentState('LOGGED_OUT');
                            setInitialized(false);
                            // Solicitar login se desconectado
                            setIsOpen(true); 
                            break;
                    }
                });
            } catch (err) {
                console.error("[Five9] Erro de Inicialização:", err);
            }
        } else {
             if (attempts < 5) {
                // Tentar inicialização novamente se o script não tiver terminado de carregar
                setTimeout(() => initializeSDK(attempts + 1), 1500)
             } else {
                 console.error('[Five9] Falha ao carregar SDK após tentativas')
             }
        }
    }

    const handleScriptLoad = () => {
        // Pequeno atraso para garantir que o script seja totalmente analisado e executado
        setTimeout(() => initializeSDK(), 500)
    }

    useEffect(() => {
        // Lidar com cenários de navegação no lado do cliente onde o script já está carregado globalmente
        // @ts-ignore
        if (window.Five9 && window.Five9.CrmSdk && !hasInited.current) {
            initializeSDK()
        }
    }, [])

    return (
        <>
            <Script 
                src="/scripts/five9.js" 
                strategy="afterInteractive"
                onLoad={handleScriptLoad}
            />
            
            {/* Botão de Ação Flutuante (Estado Recolhido) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed z-[60] bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl 
                    hover:bg-blue-700 transition-all duration-300 flex items-center justify-center
                    ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}
                `}
                title="Abrir Telefone"
                aria-label="Abrir Telefone"
            >
                <Phone size={24} />
                {isInitialized && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                )}
            </button>

            {/* 
                Container do Softphone 
                Mantém o iframe no DOM (via opacidade/visibilidade) para evitar 
                desconexão do WebSocket quando "minimizado".
            */}
            <div 
                className={`fixed z-50 transition-all duration-300 ease-in-out bg-white shadow-2xl border border-gray-200 rounded-xl overflow-hidden flex flex-col width-[360px] height-[600px]
                    ${isOpen 
                        ? 'bottom-6 right-6 w-[360px] h-[600px] opacity-100 translate-y-0' 
                        : 'bottom-6 right-6 w-[360px] h-[600px] opacity-0 translate-y-10 pointer-events-none invisible'
                    }
                `}
            >
                {/* Ações do Cabeçalho */}
                <div className="bg-slate-900 text-white p-3 flex justify-between items-center select-none">
                    <div className="flex items-center gap-2">
                        <Phone size={16} className="text-blue-400" />
                        <span className="font-semibold text-sm">Five9 Softphone</span>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                        title="Minimizar"
                    >
                        <Minimize2 size={16} />
                    </button>
                </div>

                {/* Wrapper do Iframe ADT */}
                <div className="flex-1 bg-slate-100 relative w-full h-full">
                    <iframe 
                        id="five9-adapter-frame"
                        src={ADT_URL}
                        title="Five9 Telephony Adapter"
                        allow="microphone; autoplay; camera; geolocation; display-capture"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox"
                        className="w-full h-full border-none"
                    />
                </div>
            </div>
        </>
    )
}
