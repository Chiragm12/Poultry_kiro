import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Multi-tenant middleware setup function
export function setupPrismaMiddleware() {
  // Only setup middleware if not already done
  if (!(prisma as any)._middlewareSetup) {
    prisma.$use(async (params, next) => {
      // Skip middleware for certain models that don't need tenant filtering
      const skipModels = ['Account', 'Session', 'VerificationToken']
      
      if (skipModels.includes(params.model || '')) {
        return next(params)
      }

      // For models that have organizationId, ensure it's always filtered
      if (params.model && ['User', 'Farm', 'AuditLog'].includes(params.model)) {
        if (params.action === 'findMany' || params.action === 'findFirst') {
          if (!params.args) params.args = {}
          if (!params.args.where) params.args.where = {}
          
          // Only add organizationId filter if it's not already present
          if (!params.args.where.organizationId) {
            // This will be set by the middleware in API routes
            const organizationId = (params as any).organizationId
            if (organizationId) {
              params.args.where.organizationId = organizationId
            }
          }
        }
      }

      return next(params)
    });
    
    (prisma as any)._middlewareSetup = true
  }
}

export default prisma