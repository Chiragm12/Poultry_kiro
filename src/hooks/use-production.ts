import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

interface Production {
  id: string
  date: string
  tableEggs: number
  hatchingEggs: number
  crackedEggs: number
  jumboEggs: number
  leakerEggs: number
  totalEggs: number
  inchargeEggs: number
  notes?: string
  farm: {
    id: string
    name: string
    location: string
  }
  createdAt: string
}

interface CreateProductionData {
  date: string
  farmId: string
  tableEggs: number
  hatchingEggs: number
  crackedEggs: number
  jumboEggs: number
  leakerEggs: number
  inchargeEggs: number
  notes?: string
}

interface UpdateProductionData extends Partial<CreateProductionData> {}

export function useProductions() {
  return useQuery({
    queryKey: ['productions'],
    queryFn: async (): Promise<Production[]> => {
      const response = await apiClient.get<{ success: boolean; data: { productions?: Production[] } | Production[] }>('/api/production')
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data
      }
      return response.data.productions || []
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for production data
  })
}

export function useProduction(id: string) {
  return useQuery({
    queryKey: ['productions', id],
    queryFn: async (): Promise<Production> => {
      const response = await apiClient.get<{ success: boolean; data: Production }>(`/api/production/${id}`)
      return response.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateProduction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateProductionData): Promise<Production> => {
      const response = await apiClient.post<{ success: boolean; data: Production }>('/api/production', data)
      return response.data
    },
    onSuccess: (newProduction) => {
      // Update the productions list cache
      queryClient.setQueryData(['productions'], (oldData: Production[] | undefined) => {
        return oldData ? [newProduction, ...oldData] : [newProduction]
      })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      
      toast.success('Production recorded successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record production')
    },
  })
}

export function useUpdateProduction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductionData }): Promise<Production> => {
      const response = await apiClient.put<{ success: boolean; data: Production }>(`/api/production/${id}`, data)
      return response.data
    },
    onSuccess: (updatedProduction) => {
      // Update the specific production cache
      queryClient.setQueryData(['productions', updatedProduction.id], updatedProduction)
      
      // Update the productions list cache
      queryClient.setQueryData(['productions'], (oldData: Production[] | undefined) => {
        return oldData?.map(production => 
          production.id === updatedProduction.id ? updatedProduction : production
        ) || []
      })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      
      toast.success('Production updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update production')
    },
  })
}

export function useDeleteProduction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/api/production/${id}`)
    },
    onSuccess: (_, deletedId) => {
      // Remove from productions list cache
      queryClient.setQueryData(['productions'], (oldData: Production[] | undefined) => {
        return oldData?.filter(production => production.id !== deletedId) || []
      })
      
      // Remove specific production cache
      queryClient.removeQueries({ queryKey: ['productions', deletedId] })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      
      toast.success('Production record deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete production record')
    },
  })
}