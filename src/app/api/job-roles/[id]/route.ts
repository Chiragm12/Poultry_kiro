import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId } from "@/lib/api-utils"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getOrganizationId(request)
    const body = await request.json()
    const { id } = await params

    const { title, description, salary, salaryType, isActive } = body

    // Verify job role exists and belongs to organization
    const existingJobRole = await prisma.jobRole.findFirst({
      where: {
        id,
        organizationId,
      },
    })

    if (!existingJobRole) {
      return createErrorResponse("Job role not found", 404)
    }

    const updatedJobRole = await prisma.jobRole.update({
      where: { id },
      data: {
        title,
        description,
        salary: salary ? parseFloat(salary) : undefined,
        salaryType,
        isActive,
      },
    })

    return createSuccessResponse(updatedJobRole, "Job role updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getOrganizationId(request)
    const { id } = await params

    // Verify job role exists and belongs to organization
    const existingJobRole = await prisma.jobRole.findFirst({
      where: {
        id,
        organizationId,
      },
    })

    if (!existingJobRole) {
      return createErrorResponse("Job role not found", 404)
    }

    // Check if any users are assigned to this job role
    const usersWithRole = await prisma.user.count({
      where: {
        jobRoleId: id,
      },
    })

    if (usersWithRole > 0) {
      return createErrorResponse("Cannot delete job role that is assigned to users", 400)
    }

    await prisma.jobRole.delete({
      where: { id },
    })

    return createSuccessResponse(null, "Job role deleted successfully")
  } catch (error) {
    return handleApiError(error)
  }
}