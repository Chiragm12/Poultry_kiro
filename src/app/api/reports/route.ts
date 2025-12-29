import { NextRequest } from "next/server"
import { createSuccessResponse, handleApiError, getOrganizationId } from "@/lib/api-utils"
import { ReportsService } from "@/lib/reports"
import { z } from "zod"

const reportRequestSchema = z.object({
  reportType: z.enum(["comprehensive", "production", "attendance", "daily", "weekly", "monthly"]),
  startDate: z.string(),
  endDate: z.string(),
  farmId: z.string().optional(),
  shedId: z.string().optional(),
  managerId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const body = await request.json()
    
    const validatedData = reportRequestSchema.parse(body)
    
    const reportsService = new ReportsService(organizationId)
    const reportData = await reportsService.generateReport(validatedData)
    
    return createSuccessResponse(reportData)
  } catch (error) {
    return handleApiError(error)
  }
}