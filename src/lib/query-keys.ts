// Centralized query keys for better cache management and performance
export const queryKeys = {
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
  },
  
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    weekStatus: () => [...queryKeys.analytics.all, 'week-status'] as const,
    weeklyProduction: (weeks?: number) => [...queryKeys.analytics.all, 'weekly-production', weeks] as const,
  },
  
  // Farms
  farms: {
    all: ['farms'] as const,
    lists: () => [...queryKeys.farms.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.farms.lists(), filters] as const,
    details: () => [...queryKeys.farms.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.farms.details(), id] as const,
  },
  
  // Production
  production: {
    all: ['productions'] as const,
    lists: () => [...queryKeys.production.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.production.lists(), filters] as const,
    details: () => [...queryKeys.production.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.production.details(), id] as const,
  },
  
  // Production Cycles
  productionCycles: {
    all: ['production-cycles'] as const,
    lists: () => [...queryKeys.productionCycles.all, 'list'] as const,
    list: (farmId?: string) => [...queryKeys.productionCycles.lists(), farmId] as const,
    details: () => [...queryKeys.productionCycles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.productionCycles.details(), id] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (role?: string) => [...queryKeys.users.lists(), role] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  
  // Reports
  reports: {
    all: ['reports'] as const,
    generate: (params: Record<string, any>) => [...queryKeys.reports.all, 'generate', params] as const,
  },
} as const

// Helper function to invalidate related queries after mutations
export const getInvalidationKeys = (entityType: string) => {
  switch (entityType) {
    case 'farm':
      return [
        queryKeys.farms.all,
        queryKeys.dashboard.all,
        queryKeys.production.all,
        queryKeys.productionCycles.all,
      ]
    case 'production':
      return [
        queryKeys.production.all,
        queryKeys.dashboard.all,
        queryKeys.analytics.all,
        queryKeys.reports.all,
      ]
    case 'production-cycle':
      return [
        queryKeys.productionCycles.all,
        queryKeys.analytics.all,
        queryKeys.dashboard.all,
      ]
    case 'user':
      return [
        queryKeys.users.all,
        queryKeys.dashboard.all,
      ]
    default:
      return []
  }
}