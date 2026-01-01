import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)

    const jobRoles = await prisma.jobRole.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: {
        title: 'asc',
      },
    })

    return createSuccessResponse(jobRoles)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const body = await request.json()

    const { title, description, salary, salaryType } = body

    if (!title || !salary) {
      return createErrorResponse("Title and salary are required", 400)
    }

    const jobRole = await prisma.jobRole.create({
      data: {
        title,
        description,
        salary: parseFloat(salary),
        salaryType: salaryType || "MONTHLY",
        organizationId,
      },
    })

    return createSuccessResponse(jobRole, "Job role created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}