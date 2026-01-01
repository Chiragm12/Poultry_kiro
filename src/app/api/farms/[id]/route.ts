import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateFarmSchema } from "@/lib/validations"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId, getUserRole } from "@/lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const organizationId = await getOrganizationId(request)
    const { id: farmId } = await params

    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        organizationId,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sheds: {
          select: {
            id: true,
            name: true,
            capacity: true,
            isActive: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
        _count: {
          select: {
            sheds: true,
          },
        },
      },
    })

    if (!farm) {
      return createErrorResponse("Farm not found", 404)
    }

    return createSuccessResponse(farm)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const organizationId = await getOrganizationId(request)
    const userRole = await getUserRole(request)
    const { id: farmId } = await params

    // Only OWNER can update farms
    if (userRole !== "OWNER") {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()
    const validatedData = updateFarmSchema.parse(body)

    // Verify farm exists and belongs to the organization
    const existingFarm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        organizationId,
      },
    })

    if (!existingFarm) {
      return createErrorResponse("Farm not found", 404)
    }

    // Verify manager exists and belongs to the same organization
    if (validatedData.managerId) {
      const manager = await prisma.user.findFirst({
        where: {
          id: validatedData.managerId,
          organizationId,
          role: { in: ["OWNER", "MANAGER"] },
          isActive: true,
        },
      })

      if (!manager) {
        return createErrorResponse("Invalid manager selected", 400)
      }
    }

    const farm = await prisma.farm.update({
      where: {
        id: farmId,
      },
      data: validatedData,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            sheds: true,
          },
        },
      },
    })

    return createSuccessResponse(farm, "Farm updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const organizationId = await getOrganizationId(request)
    const userRole = await getUserRole(request)
    const { id: farmId } = await params

    // Only OWNER can delete farms
    if (userRole !== "OWNER") {
      return createErrorResponse("Insufficient permissions", 403)
    }

    // Verify farm exists and belongs to the organization
    const existingFarm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        organizationId,
      },
      include: {
        _count: {
          select: {
            sheds: true,
          },
        },
      },
    })

    if (!existingFarm) {
      return createErrorResponse("Farm not found", 404)
    }

    // Check if farm has sheds
    if (existingFarm._count.sheds > 0) {
      return createErrorResponse("Cannot delete farm with existing sheds", 400)
    }

    await prisma.farm.delete({
      where: {
        id: farmId,
      },
    })

    return createSuccessResponse(null, "Farm deleted successfully")
  } catch (error) {
    return handleApiError(error)
  }
}