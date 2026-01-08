import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  organizationId: string
  createdAt: string
  updatedAt: string
}

interface CreateUserData {
  name: string
  email: string
  role: string
  password?: string
}

interface UpdateUserData extends Partial<CreateUserData> {
  isActive?: boolean
}

export function useUsers(role?: string) {
  return useQuery({
    queryKey: ['users', role],
    queryFn: async (): Promise<User[]> => {
      const url = role ? `/api/users?role=${role}` : '/api/users'
      const response = await apiClient.get<{ success: boolean; data: User[] }>(url)
      return response.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async (): Promise<User> => {
      const response = await apiClient.get<{ success: boolean; data: User }>(`/api/users/${id}`)
      return response.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateUserData): Promise<User> => {
      const response = await apiClient.post<{ success: boolean; data: User }>('/api/users', data)
      return response.data
    },
    onSuccess: (newUser) => {
      // Update the users list cache
      queryClient.setQueryData(['users'], (oldData: User[] | undefined) => {
        return oldData ? [newUser, ...oldData] : [newUser]
      })
      
      // Update role-specific cache
      queryClient.setQueryData(['users', newUser.role], (oldData: User[] | undefined) => {
        return oldData ? [newUser, ...oldData] : [newUser]
      })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      toast.success('User created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create user')
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }): Promise<User> => {
      const response = await apiClient.put<{ success: boolean; data: User }>(`/api/users/${id}`, data)
      return response.data
    },
    onSuccess: (updatedUser) => {
      // Update the specific user cache
      queryClient.setQueryData(['users', updatedUser.id], updatedUser)
      
      // Update the users list cache
      queryClient.setQueryData(['users'], (oldData: User[] | undefined) => {
        return oldData?.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        ) || []
      })
      
      // Update role-specific cache
      queryClient.setQueryData(['users', updatedUser.role], (oldData: User[] | undefined) => {
        return oldData?.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        ) || []
      })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      toast.success('User updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user')
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/api/users/${id}`)
    },
    onSuccess: (_, deletedId) => {
      // Remove from users list cache
      queryClient.setQueryData(['users'], (oldData: User[] | undefined) => {
        return oldData?.filter(user => user.id !== deletedId) || []
      })
      
      // Remove from role-specific caches
      queryClient.invalidateQueries({ queryKey: ['users'] })
      
      // Remove specific user cache
      queryClient.removeQueries({ queryKey: ['users', deletedId] })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      toast.success('User deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user')
    },
  })
}