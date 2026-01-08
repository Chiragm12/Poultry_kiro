import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

interface Farm {
  id: string
  name: string
  location: string
  description?: string
  isActive: boolean
  maleCount: number
  femaleCount: number
  organizationId: string
  managerId?: string
  createdAt: string
  updatedAt: string
  manager?: {
    id: string
    name: string
    email: string
  }
}

interface CreateFarmData {
  name: string
  location?: string
  description?: string
  managerId?: string
  maleCount?: number
  femaleCount?: number
}

interface UpdateFarmData extends Partial<CreateFarmData> {
  isActive?: boolean
}

export function useFarms() {
  return useQuery({
    queryKey: ['farms'],
    queryFn: async (): Promise<Farm[]> => {
      const response = await apiClient.get<{ success: boolean; data: Farm[] }>('/api/farms')
      return response.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useFarm(id: string) {
  return useQuery({
    queryKey: ['farms', id],
    queryFn: async (): Promise<Farm> => {
      const response = await apiClient.get<{ success: boolean; data: Farm }>(`/api/farms/${id}`)
      return response.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateFarm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateFarmData): Promise<Farm> => {
      const response = await apiClient.post<{ success: boolean; data: Farm }>('/api/farms', data)
      return response.data
    },
    onSuccess: (newFarm) => {
      // Update the farms list cache
      queryClient.setQueryData(['farms'], (oldData: Farm[] | undefined) => {
        return oldData ? [...oldData, newFarm] : [newFarm]
      })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      toast.success('Farm created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create farm')
    },
  })
}

export function useUpdateFarm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFarmData }): Promise<Farm> => {
      const response = await apiClient.put<{ success: boolean; data: Farm }>(`/api/farms/${id}`, data)
      return response.data
    },
    onSuccess: (updatedFarm) => {
      // Update the specific farm cache
      queryClient.setQueryData(['farms', updatedFarm.id], updatedFarm)
      
      // Update the farms list cache
      queryClient.setQueryData(['farms'], (oldData: Farm[] | undefined) => {
        return oldData?.map(farm => 
          farm.id === updatedFarm.id ? updatedFarm : farm
        ) || []
      })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      toast.success('Farm updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update farm')
    },
  })
}

export function useDeleteFarm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/api/farms/${id}`)
    },
    onSuccess: (_, deletedId) => {
      // Remove from farms list cache
      queryClient.setQueryData(['farms'], (oldData: Farm[] | undefined) => {
        return oldData?.filter(farm => farm.id !== deletedId) || []
      })
      
      // Remove specific farm cache
      queryClient.removeQueries({ queryKey: ['farms', deletedId] })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      toast.success('Farm deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete farm')
    },
  })
}