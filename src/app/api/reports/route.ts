import { NextRequest } from "next/server"
import { ReportService } from "@/lib/reports"
import { reportFilterSchema } from "@/lib/validations"
import { createSuccessResponse, handleApiError, getOrganizationId, getUserId } from "@/lib/api-utils"

export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const userId = await getUserId(request)
    
    const body = await request.json()
    const { reportType, ...filters } = body
    
    // Validate filters
    const validatedFilters = reportFilterSchema.parse(filters)
    
    const reportService = new ReportService(organizationId)
    
    let report
    
    switch (reportType) {
      case 'production':
        report = await reportService.generateProductionReport({
          startDate: new Date(validatedFilters.startDate),
          endDate: new Date(validatedFilters.endDate),
          farmId: validatedFilters.farmId,
          shedId: validatedFilters.shedId,
          managerId: validatedFilters.managerId
        })
        break
        
      case 'attendance':
        report = await reportService.generateAttendanceReport({
          startDate: new Date(validatedFilters.startDate),
          endDate: new Date(validatedFilters.endDate),
          farmId: validatedFilters.farmId,
          shedId: validatedFilters.shedId,
          managerId: validatedFilters.managerId
        })
        break
        
      case 'comprehensive':
        report = await reportService.generateComprehensiveReport({
          startDate: new Date(validatedFilters.startDate),
          endDate: new Date(validatedFilters.endDate),
          farmId: validatedFilters.farmId,
          shedId: validatedFilters.shedId,
          managerId: validatedFilters.managerId
        }, userId)
        break
        
      case 'daily':
        report = await reportService.generateDailyReport(
          validatedFilters.startDate ? new Date(validatedFilters.startDate) : new Date()
        )
        break
        
      case 'weekly':
        report = await reportService.generateWeeklyReport(
          validatedFilters.startDate ? new Date(validatedFilters.startDate) : new Date()
        )
        break
        
      case 'monthly':
        report = await reportService.generateMonthlyReport(
          validatedFilters.startDate ? new Date(validatedFilters.startDate) : new Date()
        )
        break
        
      default:
        throw new Error('Invalid report type')
    }

    return createSuccessResponse(report, "Report generated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}