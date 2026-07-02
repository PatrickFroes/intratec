'use server'

import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function uploadImageAction(formData: FormData): Promise<{ success: boolean, url?: string, error?: string }> {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'Arquivo não fornecido' }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = `${uuidv4()}.${extension}`

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'images')
    
    // Garante que o diretório de uploads existe
    await fs.mkdir(uploadDir, { recursive: true })
    
    const filePath = path.join(uploadDir, fileName)
    await fs.writeFile(filePath, buffer)

    // A URL pública é servida de forma estática pelo Next.js da pasta public/
    const url = `/uploads/images/${fileName}`

    return { success: true, url }
  } catch (error: any) {
    console.error('LOCAL UPLOAD ERROR:', error)
    return { success: false, error: 'Falha no upload da imagem local: ' + error.message }
  }
}
