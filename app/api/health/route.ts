import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis-server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const diagnostic: Record<string, any> = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'checking...',
      redis: 'checking...',
      storage: 'checking...',
    }

    // 1. Verificar PostgreSQL (via Prisma)
    try {
      await prisma.$queryRaw`SELECT 1`
      diagnostic.database = 'connected (PostgreSQL via Prisma)'
    } catch (dbError: any) {
      diagnostic.database = `error: ${dbError.message}`
      diagnostic.status = 'error'
    }

    // 2. Verificar Redis
    try {
      diagnostic.redis = `status: ${redis.status} (Host: ${redis.options.host || 'localhost'})`
    } catch (redisError: any) {
      diagnostic.redis = `error: ${redisError.message}`
      // Redis is optional, so we do not force diagnostic.status = 'error'
    }

    // 3. Verificar permissão de escrita local
    try {
      const dbDir = path.join(process.cwd(), 'public', 'uploads', 'images')
      await fs.mkdir(dbDir, { recursive: true })
      
      const testFile = path.join(dbDir, '.write-test')
      await fs.writeFile(testFile, 'test')
      await fs.unlink(testFile)
      
      diagnostic.storage = 'writable (public/uploads/images/)'
    } catch (storageError: any) {
      diagnostic.storage = `error: ${storageError.message}`
      diagnostic.status = 'error'
    }

    const statusCode = diagnostic.status === 'ok' ? 200 : 500
    return NextResponse.json(diagnostic, { status: statusCode })
    
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: error.message, 
      code: error.name
    }, { status: 500 })
  }
}
