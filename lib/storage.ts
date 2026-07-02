export const STORAGE_PREFIX = 'shopping-intranet:'

export const getStorageKey = (key: string) => `${STORAGE_PREFIX}${key}`

// Expresão regular para identificar strings de data ISO 8601
const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.+/

const dateReviver = (_: string, value: any) => {
  if (typeof value === 'string' && isoDateRegex.test(value)) {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date
    }
  }
  return value
}

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  try {
    const item = localStorage.getItem(getStorageKey(key))
    if (item === null || item === '') {
      return defaultValue
    }
    return JSON.parse(item, dateReviver) as T
  } catch (error) {
    console.warn(`Erro ao carregar ${key} do localStorage:`, error)
    return defaultValue
  }
}

export const saveToStorage = (key: string, value: any) => {
  if (typeof window === 'undefined') return

  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(getStorageKey(key))
    } else {
      localStorage.setItem(getStorageKey(key), JSON.stringify(value))
    }
  } catch (error) {
    console.error(`Erro ao salvar ${key} no localStorage:`, error)
  }
}
