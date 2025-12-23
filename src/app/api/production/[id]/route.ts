import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateProductionSchema } from "@/lib/validations"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId, getUserRole } from "@/lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = getOrganizationId(request)
    const productionId = params.id

    const production = await prisma.production.findFirst({
      where: {
        id: productionId,
        shed: {
          farm: {
            organizationId,
          },
        },
      },
      include: {
        shed: {
          select: {
            id: true,
            name: true,
            capacity: true,
            farm: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!production) {
      return createErrorResponse("Production record not found", 404)
    }

    return createSuccessResponse(production)
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
    const productionId = params.id

    // Only OWNER and MANAGER can update production records
    if (!["OWNER", "MANAGER"].includes(userRole)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()
    const validatedData = updateProductionSchema.parse(body)

    // Verify production record exists and belongs to the organization
    const existingProduction = await prisma.production.findFirst({
      where: {
        id: productionId,
        shed: {
          farm: {
            organizationId,
          },
        },
      },
    })

    if (!existingProduction) {
      return createErrorResponse("Production record not found", 404)
    }

    // Calculate sellable eggs if any of the egg counts are being updated
    let sellableEggs = existingProduction.sellableEggs
    if (validatedData.totalEggs !== undefined || validatedData.brokenEggs !== undefined || validatedData.damagedEggs !== undefined) {
      const totalEggs = validatedData.totalEggs ?? existingProduction.totalEggs
      const brokenEggs = validatedData.brokenEggs ?? existingProduction.brokenEggs
      const damagedEggs = validatedData.damagedEggs ?? existingProduction.damagedEggs
      sellableEggs = totalEggs - brokenEggs - damagedEggs
    }

    const production = await prisma.production.update({
      where: {
        id: productionId,
      },
      data: {
        ...validatedData,
        sellableEggs,
      },
      include: {
        shed: {
          select: {
            id: true,
            name: true,
            capacity: true,
            farm: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return createSuccessResponse(production, "Production record updated successfully")
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
    const productionId = params.id

    // Only OWNER and MANAGER can delete production records
    if (!["OWNER", "MANAGER"].includes(userRole)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    // Verify production record exists and belongs to the organization
    const existingProduction = await prisma.production.findFirst({
      where: {
        id: productionId,
        shed: {
          farm: {
            organizationId,
          },
        },
      },
    })

    if (!existingProduction) {
      return createErrorResponse("Production record not found", 404)
    }

    await prisma.production.delete({
      where: {
        id: productionId,
      },
    })

    return createSuccessResponse(null, "Production record deleted successfully")
  } catch (error) {
    return handleApiError(error)
  }
}