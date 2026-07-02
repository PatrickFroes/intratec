'use server'

import { prisma } from '@/lib/prisma'
import { getCachedData, invalidateCache } from '@/lib/redis-server'

function getModelDelegate(tableName: string): any {
  const name = tableName.replace(/^ShoppingIntranet_/, '')
  switch (name) {
    case 'Users':
      return prisma.user
    case 'Properties':
      return prisma.property
    case 'Stores':
      return prisma.store
    case 'Clients':
      return prisma.client
    case 'Tasks':
      return prisma.task
    case 'Events':
      return prisma.calendarEvent
    case 'Notifications':
      return prisma.notification
    case 'Logs':
      return prisma.auditLog
    case 'FloorPlans':
      return prisma.floorPlan
    case 'Leads':
      return prisma.lead
    default:
      throw new Error(`Prisma model mapping not found for table: ${tableName}`)
  }
}

// Helper to sanitize database output (convert Date objects to string for safe Next.js serialization)
function sanitizeOutput<T>(data: any): T {
  return JSON.parse(JSON.stringify(data)) as T
}

export async function dbGet<T>(tableName: string, id: string): Promise<T | null> {
  try {
    const cacheKey = `db_get:${tableName}:${id}`
    const result = await getCachedData(cacheKey, async () => {
      const delegate = getModelDelegate(tableName)
      return await delegate.findUnique({
        where: { id }
      })
    }, 300) // Cache por 5 minutos

    if (!result) return null
    return sanitizeOutput<T>(result)
  } catch (error) {
    console.error(`SERVER ACTION ERROR: Getting ${id} from ${tableName}`, error)
    return null
  }
}

export async function dbList<T>(tableName: string): Promise<T[]> {
  try {
    const cacheKey = `db_list:${tableName}`
    const result = await getCachedData(cacheKey, async () => {
      const delegate = getModelDelegate(tableName)
      return await delegate.findMany()
    }, 600) // Cache por 10 minutos

    return sanitizeOutput<T[]>(result || [])
  } catch (error) {
    console.error(`SERVER ACTION ERROR: Listing ${tableName}`, error)
    return []
  }
}

export async function dbCreate<T>(tableName: string, item: T): Promise<{ success: boolean, data?: T, error?: string }> {
  try {
    const delegate = getModelDelegate(tableName)
    const cleanItem = JSON.parse(JSON.stringify(item))
    
    const result = await delegate.create({
      data: cleanItem
    })

    // Invalida cache de listagem
    await invalidateCache(`db_list:${tableName}`)

    return { success: true, data: sanitizeOutput<T>(result) }
  } catch (error: any) {
    console.error(`SERVER ACTION ERROR: Creating in ${tableName}`, error)
    return { success: false, error: error.message || 'Database Create Error' }
  }
}

export async function dbUpdate(tableName: string, id: string, updates: Record<string, any>): Promise<{ success: boolean, error?: string }> {
  console.log(`[dbUpdate] Starting update for ${tableName}:${id}`, Object.keys(updates))
  try {
    if (!updates || typeof updates !== 'object') {
      return { success: false, error: 'Invalid updates payload' }
    }

    const { id: _, ...dataToUpdate } = JSON.parse(JSON.stringify(updates))
    const delegate = getModelDelegate(tableName)

    await delegate.update({
      where: { id },
      data: dataToUpdate
    })

    // Invalida caches
    await invalidateCache(`db_list:${tableName}`)
    await invalidateCache(`db_get:${tableName}:${id}`)

    console.log(`[dbUpdate] Success`)
    return { success: true }
  } catch (error: any) {
    console.error(`SERVER ACTION ERROR: Updating ${id} in ${tableName}`, error)
    return { success: false, error: error?.message || 'Database Update Error' }
  }
}

export async function dbDelete(tableName: string, id: string): Promise<{ success: boolean, error?: string }> {
  try {
    const delegate = getModelDelegate(tableName)
    await delegate.delete({
      where: { id }
    })

    // Invalida caches
    await invalidateCache(`db_list:${tableName}`)
    await invalidateCache(`db_get:${tableName}:${id}`)

    return { success: true }
  } catch (error: any) {
    console.error(`SERVER ACTION ERROR: Deleting ${id} from ${tableName}`, error)
    return { success: false, error: error.message || 'Database Delete Error' }
  }
}
