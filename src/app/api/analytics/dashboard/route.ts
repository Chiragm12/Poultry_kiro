import { NextRequest } from "next/server"
import { AnalyticsService } from "@/lib/analytics"
import { createSuccessResponse, handleApiError, getOrganizationId } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")

    const analyticsService = new AnalyticsService(organizationId)
    
    const [stats, productionTrend, shedPerformance, attendanceSummary, alerts] = await Promise.all([
      analyticsService.getDashboardStats(days),
      analyticsService.getProductionTrend(days),
      analyticsService.getShedPerformance(days),
      analyticsService.getAttendanceSummary(days),
      analyticsService.getProductionAlerts()
    ])

    return createSuccessResponse({
      stats,
      productionTrend,
      shedPerformance,
      attendanceSummary,
      alerts
    })
  } catch (error) {
    return handleApiError(error)
  }
}