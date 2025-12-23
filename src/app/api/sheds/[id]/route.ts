import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateShedSchema } from "@/lib/validations"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId, getUserRole } from "@/lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = getOrganizationId(request)
    const shedId = params.id

    const shed = await prisma.shed.findFirst({
      where: {
        id: shedId,
        farm: {
          organizationId,
        },
      },
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        productions: {
          select: {
            id: true,
            date: true,
            totalEggs: true,
            sellableEggs: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            productions: true,
          },
        },
      },
    })

    if (!shed) {
      return createErrorResponse("Shed not found", 404)
    }

    return createSuccessResponse(shed)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = getOrganizationId(request)
    const userRole = getUserRole(request)
    const shedId = params.id

    // Only OWNER and MANAGER can update sheds
    if (!["OWNER", "MANAGER"].includes(userRole)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()
    const validatedData = updateShedSchema.parse(body)

    // Verify shed exists and belongs to the organization
    const existingShed = await prisma.shed.findFirst({
      where: {
        id: shedId,
        farm: {
          organizationId,
        },
      },
      include: {
        farm: true,
      },
    })

    if (!existingShed) {
      return createErrorResponse("Shed not found", 404)
    }

    // Check if shed name already exists in the same farm (excluding current shed)
    if (validatedData.name) {
      const nameExists = await prisma.shed.findFirst({
        where: {
          name: validatedData.name,
          farmId: existingShed.farmId,
          id: { not: shedId },
        },
      })

      if (nameExists) {
        return createErrorResponse("Shed with this name already exists in the farm", 400)
      }
    }

    const shed = await prisma.shed.update({
      where: {
        id: shedId,
      },
      data: validatedData,
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        _count: {
          select: {
            productions: true,
          },
        },
      },
    })

    return createSuccessResponse(shed, "Shed updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = getOrganizationId(request)
    const userRole = getUserRole(request)
    const shedId = params.id

    // Only OWNER and MANAGER can delete sheds
    if (!["OWNER", "MANAGER"].includes(userRole)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    // Verify shed exists and belongs to the organization
    const existingShed = await prisma.shed.findFirst({
      where: {
        id: shedId,
        farm: {
          organizationId,
        },
      },
      include: {
        _count: {
          select: {
            productions: true,
          },
        },
      },
    })

    if (!existingShed) {
      return createErrorResponse("Shed not found", 404)
    }

    // Check if shed has production records
    if (existingShed._count.productions > 0) {
      return createErrorResponse("Cannot delete shed with existing production records", 400)
    }

    await prisma.shed.delete({
      where: {
        id: shedId,
      },
    })

    return createSuccessResponse(null, "Shed deleted successfully")
  } catch (error) {
    return handleApiError(error)
  }
}