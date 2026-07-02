import { dbCreate, dbDelete, dbList, dbUpdate, dbGet } from '@/app/actions/db'

// Helper genérico agora usando SERVER ACTIONS
export const api = {
  async list<T>(tableName: string): Promise<T[]> {
      return await dbList<T>(tableName)
  },
  
  async get<T>(tableName: string, id: string): Promise<T | null> {
      return await dbGet<T>(tableName, id)
  },

  async create<T>(tableName: string, item: T): Promise<T> {
      const res = await dbCreate<T>(tableName, item)
      if (!res.success) {
          throw new Error(res.error || 'Failed to create item')
      }
      return res.data as T
  },

  async update(tableName: string, id: string, updates: Record<string, any>) {
      const res = await dbUpdate(tableName, id, updates)
      if (!res.success) {
          throw new Error(res.error || 'Failed to update item')
      }
      return res
  },

  async delete(tableName: string, id: string) {
      const res = await dbDelete(tableName, id)
      if (!res.success) {
          throw new Error(res.error || 'Failed to delete item')
      }
      return res
  }
}
