import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

interface ProductionCycle {
  id: string
  name: string
  startDate: string
  startWeek: number
  expectedEndWeek: number
  isActive: boolean
  farmId: string
  createdAt: string
  farm: {
    id: string
    name: string
    location: string
  }
}

interface CreateCycleData {
  name: string
  startDate: string
  startWeek: number
  expectedEndWeek: number
  farmId: string
}

interface UpdateCycleData extends Partial<CreateCycleData> {
  isActive?: boolean
}

export function useProductionCycles(farmId?: string) {
  return useQuery({
    queryKey: ['production-cycles', farmId],
    queryFn: async (): Promise<ProductionCycle[]> => {
      const url = farmId ? `/api/production-cycles?farmId=${farmId}` : '/api/production-cycles'
      const response = await apiClient.get<{ success: boolean; data: ProductionCycle[] }>(url)
      return response.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useProductionCycle(id: string) {
  return useQuery({
    queryKey: ['production-cycles', id],
    queryFn: async (): Promise<ProductionCycle> => {
      const response = await apiClient.get<{ success: boolean; data: ProductionCycle }>(`/api/production-cycles/${id}`)
      return response.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateProductionCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCycleData): Promise<ProductionCycle> => {
      const response = await apiClient.post<{ success: boolean; data: ProductionCycle }>('/api/production-cycles', data)
      return response.data
    },
    onSuccess: (newCycle) => {
      // Update the cycles list cache
      queryClient.setQueryData(['production-cycles'], (oldData: ProductionCycle[] | undefined) => {
        return oldData ? [newCycle, ...oldData] : [newCycle]
      })
      
      // Update farm-specific cache
      queryClient.setQueryData(['production-cycles', newCycle.farmId], (oldData: ProductionCycle[] | undefined) => {
        return oldData ? [newCycle, ...oldData] : [newCycle]
      })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['analytics', 'week-status'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'weekly-production'] })
      
      toast.success('Production cycle created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create production cycle')
    },
  })
}

export function useUpdateProductionCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCycleData }): Promise<ProductionCycle> => {
      const response = await apiClient.put<{ success: boolean; data: ProductionCycle }>(`/api/production-cycles/${id}`, data)
      return response.data
    },
    onSuccess: (updatedCycle) => {
      // Update the specific cycle cache
      queryClient.setQueryData(['production-cycles', updatedCycle.id], updatedCycle)
      
      // Update the cycles list cache
      queryClient.setQueryData(['production-cycles'], (oldData: ProductionCycle[] | undefined) => {
        return oldData?.map(cycle => 
          cycle.id === updatedCycle.id ? updatedCycle : cycle
        ) || []
      })
      
      // Update farm-specific cache
      queryClient.setQueryData(['production-cycles', updatedCycle.farmId], (oldData: ProductionCycle[] | undefined) => {
        return oldData?.map(cycle => 
          cycle.id === updatedCycle.id ? updatedCycle : cycle
        ) || []
      })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['analytics', 'week-status'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'weekly-production'] })
      
      toast.success('Production cycle updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update production cycle')
    },
  })
}

export function useDeleteProductionCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/api/production-cycles/${id}`)
    },
    onSuccess: (_, deletedId) => {
      // Remove from cycles list cache
      queryClient.setQueryData(['production-cycles'], (oldData: ProductionCycle[] | undefined) => {
        return oldData?.filter(cycle => cycle.id !== deletedId) || []
      })
      
      // Remove specific cycle cache
      queryClient.removeQueries({ queryKey: ['production-cycles', deletedId] })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['analytics', 'week-status'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'weekly-production'] })
      
      toast.success('Production cycle deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete production cycle')
    },
  })
}