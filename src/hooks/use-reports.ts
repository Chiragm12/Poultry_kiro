import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface WeeklyProductionSummary {
  week: number
  startDate: string
  endDate: string
  totalEggs: number
  sellableEggs: number
  wasteEggs: number
  averageDaily: number
  efficiency: number
  daysRecorded: number
}

interface ReportData {
  metadata: {
    reportType: string
    organizationName: string
    dateRange: string
    generatedAt: string
    generatedBy?: string
  }
  production?: {
    summary: {
      totalEggs: number
      sellableEggs: number
      brokenEggs: number
      damagedEggs: number
      lossPercentage: number
      averageDaily: number
    }
    farmBreakdown: Array<{
      farmId: string
      farmName: string
      totalEggs: number
      sellableEggs: number
      efficiency: number
    }>
    productionDetails: Array<any>
  }
  attendance?: {
    summary: {
      totalWorkers: number
      averageAttendanceRate: number
      totalPresentDays: number
      totalLateDays: number
      totalAbsentDays: number
    }
    workerBreakdown: Array<any>
  }
  insights?: {
    productionTrends?: { description: string }
    attendanceInsights?: { description: string }
    recommendations: string[]
  }
}

interface GenerateReportParams {
  reportType: string
  startDate: string
  endDate: string
  farmId?: string
  shedId?: string
  managerId?: string
}

export function useWeeklyProduction(weeks: number = 12) {
  return useQuery({
    queryKey: ['analytics', 'weekly-production', weeks],
    queryFn: async (): Promise<WeeklyProductionSummary[]> => {
      const response = await apiClient.get<{ data: WeeklyProductionSummary[] }>(`/api/analytics/weekly-production?weeks=${weeks}`)
      return response.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useGenerateReport() {
  return useMutation({
    mutationFn: async (params: GenerateReportParams): Promise<ReportData> => {
      const response = await apiClient.post<{ data: ReportData }>('/api/reports', params)
      return response.data
    },
  })
}