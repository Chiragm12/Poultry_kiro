import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

interface DashboardStats {
  totalProduction: number
  todayProduction: number
  todayNormalEggs: number
  attendanceRate: number
  activeFarms: number
  activeSheds: number
  totalWorkers: number
  presentWorkers: number
}

interface FlockData {
  openingFemale: number
  openingMale: number
  mortalityF: number
  mortalityM: number
  closingFemale: number
  closingMale: number
}

interface RecentActivity {
  id: string
  action: string
  details: string
  time: string
}

interface DashboardData {
  stats: DashboardStats
  flockData: FlockData
  recentActivity: RecentActivity[]
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async (): Promise<DashboardData> => {
      const response = await apiClient.get<{ success: boolean; data: DashboardData }>('/api/dashboard/stats')
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard data
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  })
}

interface WeekStatus {
  currentWeek: number
  dayOfWeek: number
  dayName: string
  totalDays: number
  weeksRemaining: number
  cycleName?: string
  cycleStartDate?: string
}

export function useWeekStatus() {
  return useQuery({
    queryKey: queryKeys.analytics.weekStatus(),
    queryFn: async (): Promise<WeekStatus> => {
      const response = await apiClient.get<{ data: WeekStatus }>('/api/analytics/week-status')
      return response.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for week status
  })
}