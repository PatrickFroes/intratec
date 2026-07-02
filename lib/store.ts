import { create } from 'zustand'
import { api } from './api'
import { TableNames } from './dynamo'
import { v4 as uuidv4 } from 'uuid'

export interface User {
  id: string
  name: string
  email: string
  // Role mantido apenas para compatibilidade legada, mas o sistema usará permissions
  role: 'admin' | 'user'
  permissions: UserPermissions
  password: string
  avatar?: string
  color?: string // Cor identificadora do corretor na planta baixa
}

export type PermissionLevel = 'none' | 'reader' | 'editor'

export interface UserPermissions {
  overview: PermissionLevel
  relatorios: PermissionLevel
  plantaBaixa: PermissionLevel
  lojas: PermissionLevel
  calendario: PermissionLevel
  tarefas: PermissionLevel
  cadastros: PermissionLevel
  clientes: PermissionLevel
  crm: PermissionLevel
  corretores: PermissionLevel
  notificacoes: PermissionLevel
  auditoria: PermissionLevel
}

export const DEFAULT_PERMISSIONS_USER: UserPermissions = {
  overview: 'reader',
  relatorios: 'none',
  plantaBaixa: 'reader',
  lojas: 'reader',
  calendario: 'reader',
  tarefas: 'reader',
  cadastros: 'none',
  clientes: 'none',
  crm: 'none',
  corretores: 'none',
  notificacoes: 'reader',
  auditoria: 'none'
}

export const DEFAULT_PERMISSIONS_ADMIN: UserPermissions = {
  overview: 'editor',
  relatorios: 'editor',
  plantaBaixa: 'editor',
  lojas: 'editor',
  calendario: 'editor',
  tarefas: 'editor',
  cadastros: 'editor',
  clientes: 'editor',
  crm: 'editor',
  corretores: 'editor',
  notificacoes: 'editor',
  auditoria: 'editor'
}

export interface Property {
  id: string
  name: string
  address: string
  city: string
  manager: string
  phone: string
  capacity: number
  totalArea: number
  createdAt: Date
  /** @deprecated Use uploadFloorPlan/fetchFloorPlan instead. Kept for legacy compatibility only. */
  floorPlanImage?: string 
  image?: string // Foto ilustrativa do empreendimento
  storeMarkers?: StoreMarker[]
  agentMarkers?: AgentMarker[]
  agentColors?: Record<string, string>
}

export interface FloorPlan {
    id: string // Same as Property ID for 1:1 relationship
    imageBase64: string
}

export interface StoreMarker {
  storeId: string
  x: number
  y: number
}

export interface AgentMarker {
  id: string
  agentId: string
  x: number
  y: number
  notes?: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  document: string // CPF/CNPJ
  createdAt: Date
  agentId?: string 
}

export type InteractionType = 'note' | 'call' | 'meeting' | 'email'

export interface Interaction {
  id: string
  type: InteractionType
  content: string
  date: Date
  createdBy: string
}

export type LeadStatus = 'new' | 'contacted' | 'visit' | 'negotiation' | 'won' | 'lost'

export interface Lead {
  id: string
  name: string // Nome do cliente/contato
  companyName?: string // Razão Social / Nome Fantasia
  document: string // CNPJ/CPF
  email: string
  phone: string
  niche: string // Nicho de loja
  targetPropertyId: string // Empreendimento pretendido
  intendedSize: number // Tamanho pretendido em m²
  status: LeadStatus
  notes?: string // @deprecated Use interactions for history
  interactions?: Interaction[]
  agentId: string // Vendedor/Corretor responsável
  createdAt: Date
  updatedAt: Date
}

export interface Store {
  id: string
  name: string
  propertyId: string
  clientId?: string
  category: string
  manager: string
  phone: string
  area: number
  contractStart?: string
  contractEnd?: string
  rentValue?: number
  status?: 'active' | 'inactive'
  createdAt: Date
  image?: string // Foto ilustrativa da loja
  agentId?: string // ID do corretor responsável
}

export interface Task {
  id: string
  userIds: string[]
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate: Date
  storeId?: string // Optional link to store
  createdAt: Date
}

export interface CalendarEvent {
  id: string
  title: string
  description: string
  date: Date
  time: string
  location: string
  organizer: string
  userIds: string[]
  createdAt: Date
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: Date
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  entity: string
  entityId: string
  details: string
  timestamp: string
}

interface AppStore {
  currentUser: User | null
  logs: AuditLog[]
  fetchLogs: () => Promise<void>
  addLog: (action: string, entity: string, entityId: string, details: string) => Promise<void>

  setCurrentUser: (user: User) => void
  login: (email: string, password: string) => Promise<boolean>
  users: User[]
  fetchUsers: () => Promise<void>
  addUser: (user: Omit<User, 'id'>) => Promise<void>
  updateUser: (id: string, user: Partial<User>) => Promise<void>
  removeUser: (id: string) => Promise<void>

  properties: Property[]
  fetchProperties: () => Promise<void>
  addProperty: (property: Omit<Property, 'id' | 'createdAt'>) => Promise<void>
  updateProperty: (id: string, property: Partial<Property>) => Promise<void>
  removeProperty: (id: string) => Promise<void>
  
  // New Floor Plan Actions
  uploadFloorPlan: (propertyId: string, base64: string) => Promise<void>
  fetchFloorPlan: (propertyId: string) => Promise<string | null>

  clients: Client[]
  fetchClients: () => Promise<void>
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<void>
  updateClient: (id: string, client: Partial<Client>) => Promise<void>
  removeClient: (id: string) => Promise<void>

  stores: Store[]
  fetchStores: () => Promise<void>
  addStore: (store: Omit<Store, 'id' | 'createdAt'>) => Promise<void>
  updateStore: (id: string, store: Partial<Store>) => Promise<void>
  removeStore: (id: string) => Promise<void>

  leads: Lead[]
  fetchLeads: () => Promise<void>
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateLead: (id: string, lead: Partial<Lead>) => Promise<void>
  removeLead: (id: string) => Promise<void>

  tasks: Task[]
  fetchTasks: () => Promise<void>
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>
  updateTask: (id: string, task: Partial<Task>) => Promise<void>
  removeTask: (id: string) => Promise<void>

  events: CalendarEvent[]
  fetchEvents: () => Promise<void>
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => Promise<void>
  removeEvent: (id: string) => Promise<void>

  notifications: Notification[]
  fetchNotifications: () => Promise<void>
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>
  markNotificationAsRead: (id: string) => Promise<void>
  removeNotification: (id: string) => Promise<void>

  logout: () => void
  isInitialized: boolean
  isLoading: boolean
  setInitialized: (value: boolean) => void

  // UI State
  isSidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void

  // Recents
  recentPropertyIds: string[]
  visitProperty: (id: string) => void
  loadRecents: () => void
}

const INITIAL_ADMIN: User = {
  id: 'admin-seed',
  name: 'Administrador Inicial',
  email: 'admin@shopping.com',
  password: 'admin',
  role: 'admin',
  permissions: DEFAULT_PERMISSIONS_ADMIN
}

export const useAppStore = create<AppStore>((set, get) => {
  const initialState = {
    currentUser: null,
    users: [],
    properties: [],
    clients: [],
    stores: [],
    leads: [],
    tasks: [],
    events: [],
    notifications: [],
    logs: [],
    isInitialized: false,
    isLoading: false,
    isSidebarOpen: false,
    recentPropertyIds: []
  }

  return {
    ...initialState,
    setInitialized: (value) => set({ isInitialized: value }),
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    closeSidebar: () => set({ isSidebarOpen: false }),

    visitProperty: (id: string) => {
        set((state) => {
            const current = state.recentPropertyIds.filter(pid => pid !== id)
            const updated = [id, ...current].slice(0, 5) // Keep top 5
            localStorage.setItem('recent_properties', JSON.stringify(updated))
            return { recentPropertyIds: updated }
        })
    },

    loadRecents: () => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('recent_properties')
            if (stored) {
                try {
                    const parsed = JSON.parse(stored)
                    if (Array.isArray(parsed)) {
                        set({ recentPropertyIds: parsed })
                    }
                } catch (e) {
                    console.error('Failed to parse recent_properties', e)
                }
            }
        }
    },
    
    // Initialize recents on startup (call this in a useEffect in layout or app init if needed, 
    // or just lazy load. Since we use Persist or just custom logic, let's add a init method if we had one.
    // simpler: Let's read it in the store init if we can, but we are inside a function.
    // For now we rely on the consumer to maybe hydrate it? Or just let it start empty per session if we don't hydrate.
    // Actually, let's hydrate it in `fetchProperties` or similar common action if we want, or just add a `hydrateRecents` action.
    // Better: Modify `initialState`? No, localStorage is browser only.
    // We will stick to state, but let's try to load from localStorage on init if possible.
    // Since this is client-side, we can try reading localStorage if available.
    
    fetchLogs: async () => {
        const logs = await api.list<AuditLog>(TableNames.LOGS)
        set({ logs: logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) })
    },
    
    addLog: async (action, entity, entityId, details) => {
        const currentUser = get().currentUser
        if (!currentUser) return // Should not happen usually, maybe system action
        
        const log: AuditLog = {
            id: uuidv4(),
            userId: currentUser.id,
            userName: currentUser.name,
            action,
            entity,
            entityId,
            details,
            timestamp: new Date().toISOString()
        }
        
        // Optimistic update
        set((state) => ({ logs: [log, ...state.logs] }))
        await api.create(TableNames.LOGS, log)
    },

    setCurrentUser: (user) => {
      set({ currentUser: user })
      if (typeof window !== 'undefined') {
        localStorage.setItem('shopping-intranet:currentUser', JSON.stringify(user))
      }
    },

    login: async (email, password) => {
      set({ isLoading: true })
      try {
        await get().fetchUsers()
        const users = get().users
        
        let user = users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        )

        if (!user && email === INITIAL_ADMIN.email && password === INITIAL_ADMIN.password) {
          user = INITIAL_ADMIN
        }

        if (user) {
          get().setCurrentUser(user)
          return true
        }
        return false
      } finally {
        set({ isLoading: false })
      }
    },

    // ================= USERS =================
    fetchUsers: async () => {
      const users = await api.list<User>(TableNames.USERS)
      set({ users })
    },
    addUser: async (userData) => {
      const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16)
      const newUser = { 
        ...userData, 
        id: uuidv4(),
        color: userData.color || randomColor
      }
      await api.create(TableNames.USERS, newUser)
      set((state) => ({ users: [...state.users, newUser] }))
      get().addLog('create', 'user', newUser.id, `Adicionou usuário: ${newUser.name}`)
    },
    updateUser: async (id: string, userData: Partial<User>) => {
      await api.update(TableNames.USERS, id, userData)
      set((state) => ({
        users: state.users.map((u) => 
          u.id === id ? { ...u, ...userData } : u
        )
      }))
      get().addLog('update', 'user', id, `Atualizou usuário`)
    },
    removeUser: async (id) => {
      const user = get().users.find(u => u.id === id)
      await api.delete(TableNames.USERS, id)
      set((state) => ({ users: state.users.filter((u) => u.id !== id) }))
      get().addLog('delete', 'user', id, `Removeu usuário: ${user?.name || id}`)
    },

    // ================= PROPERTIES =================
    fetchProperties: async () => {
      const properties = await api.list<Property>(TableNames.PROPERTIES)
      set({ properties })
      
      // Auto-migration of legacy floor plans to separate table
      // This solves the 400KB limit issue for existing data
      properties.forEach(async (p) => {
          if (p.floorPlanImage && p.floorPlanImage.length > 100) {
             try {
                // 1. Check if already exists in new table to avoid overwriting/duplicating work
                const existing = await api.get(TableNames.FLOOR_PLANS, p.id)
                if (!existing) {
                    await api.create(TableNames.FLOOR_PLANS, { id: p.id, imageBase64: p.floorPlanImage })
                }
                        // 2. Remove from property item to free space. Use null to persist "empty" state in DB.
                await get().updateProperty(p.id, { floorPlanImage: null as any })
                console.log(`Migrated legacy floorplan for ${p.id}`)

             } catch (e) {
                 console.error('Migration failed', e)
             }
          }
      })
    },
    addProperty: async (propertyData) => {
      const newProperty = { 
        ...propertyData, 
        id: uuidv4(), 
        createdAt: new Date().toISOString() as unknown as Date
      }
      await api.create(TableNames.PROPERTIES, newProperty)
      set((state) => ({ properties: [...state.properties, newProperty] }))
      get().addLog('create', 'property', newProperty.id, `Criou empreendimento: ${newProperty.name}`)
    },
    updateProperty: async (id, propertyData) => {
      // Optimistic Update
      const previousProperties = get().properties
      set((state) => ({
        properties: state.properties.map((p) =>
          p.id === id ? { ...p, ...propertyData } : p
        ),
      }))

      try {
        await api.update(TableNames.PROPERTIES, id, propertyData)
        get().addLog('update', 'property', id, `Atualizou empreendimento`)
      } catch (error: any) {
        console.error('Failed to update property, reverting:', error)
        set({ properties: previousProperties })
        
        get().addNotification({
             userId: get().currentUser?.id || 'system',
             title: 'Erro ao salvar alteração',
             message: `Falha ao salvar dados: ${error.message}. Tente recarregar a página.`,
             type: 'error',
             read: false
        })
      }
    },
    removeProperty: async (id) => {
      const prop = get().properties.find(p => p.id === id)
      await api.delete(TableNames.PROPERTIES, id)
      // Attempt to delete floor plan too (ignore error if not exists)
      try { await api.delete(TableNames.FLOOR_PLANS, id) } catch {}
      
      set((state) => ({ properties: state.properties.filter(p => p.id !== id) }))
      get().addLog('delete', 'property', id, `Removeu empreendimento: ${prop?.name || id}`)
    },

    uploadFloorPlan: async (propertyId, base64) => {
        // Optimized: Save into dedicated table
        const floorPlan: FloorPlan = {
            id: propertyId,
            imageBase64: base64
        }
        await api.create(TableNames.FLOOR_PLANS, floorPlan)
        // Note: We don't update 'properties' state with the image to keep it light.
        // The component should call fetchFloorPlan when needed.
        
        // Update property just to toggle "hasFloorPlan" flag if we had one? 
        // Actually, we can assume if fetch returns something, it has it.
        // But for compatibility, let's update a flag or just rely on the separate fetch.
        
        // Clean legacy image from Property table if it exists to free up space
        const prop = get().properties.find(p => p.id === propertyId)
        if (prop && prop.floorPlanImage) {
            await get().updateProperty(propertyId, { floorPlanImage: null as any })
        }
        
        get().addLog('update', 'property', propertyId, `Atualizou planta baixa (v2)`)
    },
    
    fetchFloorPlan: async (propertyId) => {
        // First try dedicated table
        const floorPlan = await api.get<FloorPlan>(TableNames.FLOOR_PLANS, propertyId)
        if (floorPlan) return floorPlan.imageBase64
        
        // Fallback: Check property legacy field
        const prop = get().properties.find(p => p.id === propertyId)
        if (prop?.floorPlanImage) return prop.floorPlanImage
        
        return null
    },

    // ================= CLIENTS =================
    fetchClients: async () => {
      const clients = await api.list<Client>(TableNames.CLIENTS)
      set({ clients })
    },
    addClient: async (clientData) => {
      const newClient = {
        ...clientData,
        id: uuidv4(), 
        createdAt: new Date().toISOString() as unknown as Date
      }
      await api.create(TableNames.CLIENTS, newClient)
      set((state) => ({ clients: [...state.clients, newClient] }))
    },
    updateClient: async (id, clientData) => {
      await api.update(TableNames.CLIENTS, id, clientData)
      set((state) => ({
        clients: state.clients.map((c) =>
          c.id === id ? { ...c, ...clientData } : c
        ),
      }))
    },
    removeClient: async (id) => {
      const client = get().clients.find(c => c.id === id)
      await api.delete(TableNames.CLIENTS, id)
      set((state) => ({ clients: state.clients.filter(c => c.id !== id) }))
      get().addLog('delete', 'client', id, `Removeu cliente: ${client?.name || id}`)
    },

    // ================= STORES =================
    fetchStores: async () => {
      const stores = await api.list<Store>(TableNames.STORES)
      set({ stores })
    },
    addStore: async (storeData) => {
      const newStore = { 
        ...storeData, 
        id: uuidv4(), 
        createdAt: new Date().toISOString() as unknown as Date
      }
      await api.create(TableNames.STORES, newStore)
      set((state) => ({ stores: [...state.stores, newStore] }))
      get().addLog('create', 'store', newStore.id, `Criou loja: ${newStore.name}`)
    },
    updateStore: async (id, storeData) => {
      await api.update(TableNames.STORES, id, storeData)
      set((state) => ({
        stores: state.stores.map((s) =>
          s.id === id ? { ...s, ...storeData } : s
        ),
      }))
      get().addLog('update', 'store', id, `Atualizou loja`)
    },
    removeStore: async (id) => {
      const store = get().stores.find(s => s.id === id)
      await api.delete(TableNames.STORES, id)
      set((state) => ({ stores: state.stores.filter(s => s.id !== id) }))
      get().addLog('delete', 'store', id, `Removeu loja: ${store?.name || id}`)
    },

    // ================= LEADS =================
    fetchLeads: async () => {
      const leads = await api.list<Lead>(TableNames.LEADS)
      set({ leads })
    },
    addLead: async (leadData) => {
      const newLead: Lead = { 
        ...leadData, 
        id: uuidv4(), 
        createdAt: new Date(),
        updatedAt: new Date(),
        // Convert to unknown then Date is a hack if typing mismatches in Dynamo string vs JS Date object
        // But for Lead let's try standard JS Date for now, assuming api handles marshalling if needed or strings.
        // Actually api/db actions usually return what they get.
        // Let's stick to standard practice here:
      }
      
      // Auto-set agent if not provided and not admin? Or keep as is.
      await api.create(TableNames.LEADS, newLead)
      set((state) => ({ leads: [...state.leads, newLead] }))
      get().addLog('create', 'lead', newLead.id, `Criou lead: ${newLead.name}`)
    },
    updateLead: async (id, leadData) => {
      const updatedData = { ...leadData, updatedAt: new Date() }
      await api.update(TableNames.LEADS, id, updatedData)
      set((state) => ({
        leads: state.leads.map((l) =>
          l.id === id ? { ...l, ...updatedData } : l
        )
      }))
      get().addLog('update', 'lead', id, `Atualizou lead`)
    },
    removeLead: async (id) => {
      const lead = get().leads.find(l => l.id === id)
      await api.delete(TableNames.LEADS, id)
      set((state) => ({ leads: state.leads.filter(l => l.id !== id) }))
      get().addLog('delete', 'lead', id, `Removeu lead: ${lead?.name || id}`)
    },

    // ================= TASKS =================
    fetchTasks: async () => {
      const tasks = await api.list<Task>(TableNames.TASKS)
      set({ tasks })
    },
    addTask: async (taskData) => {
      const newTask = { 
        ...taskData, 
        id: uuidv4(), 
        createdAt: new Date().toISOString() as unknown as Date
      }
      await api.create(TableNames.TASKS, newTask)
      set((state) => ({ tasks: [...state.tasks, newTask] }))

      get().addLog('create', 'task', newTask.id, `Criou tarefa: ${newTask.title}`)

      const { title, userIds, dueDate } = taskData
      if (userIds && userIds.length > 0) {
        for (const userId of userIds) {
          const notification = {
            userId,
            title: 'Nova Tarefa Atribuída',
            message: `Você tem uma nova tarefa: "${title}" para ${new Date(dueDate).toLocaleDateString()}`,
            type: 'info' as const,
            read: false
          }
          await get().addNotification(notification)
        }
      }
    },
    updateTask: async (id, taskData) => {
      await api.update(TableNames.TASKS, id, taskData)
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...taskData } : t
        ),
      }))
      get().addLog('update', 'task', id, `Atualizou tarefa`)
    },
    removeTask: async (id) => {
      const task = get().tasks.find(t => t.id === id)
      await api.delete(TableNames.TASKS, id)
      set((state) => ({ tasks: state.tasks.filter(t => t.id !== id) }))
      get().addLog('delete', 'task', id, `Removeu tarefa: ${task?.title || id}`)
    }, 

    // ================= EVENTS =================
    fetchEvents: async () => {
      const events = await api.list<CalendarEvent>(TableNames.EVENTS)
      set({ events })
    },
    addEvent: async (eventData) => {
      const newEvent = { 
        ...eventData, 
        id: uuidv4(), 
        createdAt: new Date().toISOString() as unknown as Date
      }
      await api.create(TableNames.EVENTS, newEvent)
      set((state) => ({ events: [...state.events, newEvent] }))
      get().addLog('create', 'event', newEvent.id, `Criou evento: ${newEvent.title}`)

      const { userIds, title, date, time } = eventData
      for (const uid of userIds) {
        await get().addNotification({
          userId: uid,
          title: 'Convite de Evento',
          message: `Você foi convidado para "${title}" em ${new Date(date).toLocaleDateString()} às ${time}`,
          type: 'info',
          read: false
        })
      }
    },
    removeEvent: async (id) => {
      const event = get().events.find(e => e.id === id)
      await api.delete(TableNames.EVENTS, id)
      set((state) => ({ events: state.events.filter(e => e.id !== id) }))
      get().addLog('delete', 'event', id, `Removeu evento: ${event?.title || id}`)
    },

    // ================= NOTIFICATIONS =================
    fetchNotifications: async () => {
      const notifications = await api.list<Notification>(TableNames.NOTIFICATIONS)
      set({ notifications })
    },
    addNotification: async (notificationData) => {
      const newNotification = { 
        ...notificationData, 
        id: uuidv4(), 
        createdAt: new Date().toISOString() as unknown as Date
      }
      await api.create(TableNames.NOTIFICATIONS, newNotification)
      set((state) => ({ notifications: [newNotification, ...state.notifications] }))
    },
    markNotificationAsRead: async (id) => {
      await api.update(TableNames.NOTIFICATIONS, id, { read: true })
      set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      }))
    },
    removeNotification: async (id) => {
      await api.delete(TableNames.NOTIFICATIONS, id)
      set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) }))
    },

    logout: () => {
      set({ currentUser: null })
      if (typeof window !== 'undefined') {
        localStorage.removeItem('shopping-intranet:currentUser')
      }
    }
  }
})

