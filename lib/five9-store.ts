import { create } from 'zustand'

export type AgentState = 'LOGGED_OUT' | 'READY' | 'NOT_READY' | 'WORKING' | 'UNKNOWN'
export type CallState = 'IDLE' | 'RINGING' | 'ACTIVE' | 'HELD' | 'FINISHING'

export interface Five9Store {
    isInitialized: boolean
    agentState: AgentState
    callState: CallState
    activeNumber: string | null
    callDuration: number
    agentName: string | null
    
    // Actions
    setInitialized: (val: boolean) => void
    setAgentState: (state: AgentState) => void
    setCallState: (state: CallState) => void
    setActiveNumber: (num: string | null) => void
    
    // SDK Wrapper Methods (to be called from UI)
    makeCall: (number: string) => void
    answerCall: () => void
    hangupCall: () => void
    setAvailability: (isAvailable: boolean) => void
}

export const useFive9Store = create<Five9Store>((set) => ({
    isInitialized: false,
    agentState: 'LOGGED_OUT',
    callState: 'IDLE',
    activeNumber: null,
    callDuration: 0,
    agentName: null,

    setInitialized: (val) => set({ isInitialized: val }),
    setAgentState: (state) => set({ agentState: state }),
    setCallState: (state) => set({ callState: state }),
    setActiveNumber: (num) => set({ activeNumber: num }),

    makeCall: (number) => {
        // @ts-ignore
        if (window.Five9?.CrmSdk) {
            console.log('Five9: Dialing', number)
            // @ts-ignore
            window.Five9.CrmSdk.interactionApi().clickToDial(number)
            set({ activeNumber: number, callState: 'ACTIVE' }) // Optimistic update
        } else {
            console.error('Five9 SDK not loaded')
        }
    },

    answerCall: () => {
         // @ts-ignore
         if (window.Five9?.CrmSdk) {
             // We need to get the current interaction ID usually, 
             // but often accepting check usually picks the offering one.
             // We will implement simpler logic for now.
             console.log('Five9: Answering')
         }
    },

    hangupCall: () => {
        // @ts-ignore
        if (window.Five9?.CrmSdk) {
            console.log('Five9: Hanging up')
            // @ts-ignore
             window.Five9.CrmSdk.interactionApi().dispose() 
        }
    },

    setAvailability: (isAvailable) => {
        // @ts-ignore
        if (window.Five9?.CrmSdk) {
             // Logic to find the "Ready" state ID would go here
             console.log('Five9: Setting availability', isAvailable)
        }
    }
}))
