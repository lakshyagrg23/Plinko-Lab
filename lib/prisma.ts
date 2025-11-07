/**
 * Prisma Client Singleton
 * 
 * This ensures we don't create multiple Prisma Client instances
 * during development (which can exhaust database connections)
 * Configured for Turso libSQL with driver adapter
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Check if we're using Turso (libsql://) or local SQLite (file:)
  const databaseUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || '';
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL or TURSO_DATABASE_URL environment variable is required');
  }
  
  console.log('[Prisma] Initializing with URL:', databaseUrl.substring(0, 30) + '...');
  
  if (databaseUrl.startsWith('libsql://')) {
    // Turso/libSQL setup with driver adapter
    const authToken = process.env.TURSO_AUTH_TOKEN;
    
    if (!authToken) {
      throw new Error('TURSO_AUTH_TOKEN environment variable is required for libSQL connections');
    }
    
    // Create adapter using the config-based approach
    const adapter = new PrismaLibSQL({
      url: databaseUrl,
      authToken: authToken,
    });
    
    console.log('[Prisma] Using Turso/libSQL adapter');
    
    return new PrismaClient({ 
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  } else {
    // Local SQLite setup (file:./dev.db)
    console.log('[Prisma] Using local SQLite');
    
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
