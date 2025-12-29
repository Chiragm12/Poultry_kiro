import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateProductionSchema } from "@/lib/validations"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId, getUserRole } from "@/lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const organizationId = await getOrganizationId(request)

    const production = await prisma.production.findFirst({
      where: {
        id,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const organizationId = await getOrganizationId(request)
    const userRole = await getUserRole(request)

    // Only OWNER and MANAGER can update production records
    if (!["OWNER", "MANAGER"].includes(userRole)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()
    const validatedData = updateProductionSchema.parse(body)

    // Verify production record exists and belongs to the organization
    const existingProduction = await prisma.production.findFirst({
      where: {
        id,
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

    // Calculate sellable eggs (normal + commercial eggs)
    let sellableEggs = existingProduction.sellableEggs
    if (validatedData.normalEggs !== undefined || validatedData.commEggs !== undefined) {
      const normalEggs = validatedData.normalEggs ?? existingProduction.normalEggs
      const commEggs = validatedData.commEggs ?? existingProduction.commEggs
      sellableEggs = normalEggs + commEggs
    }

    // Update backward compatibility fields
    const updateData: any = {
      ...validatedData,
      sellableEggs,
    }

    // Handle backward compatibility
    if (validatedData.creakEggs !== undefined) {
      updateData.crackedEggs = validatedData.creakEggs
      updateData.brokenEggs = validatedData.creakEggs
    }
    if (validatedData.jellyEggs !== undefined) {
      updateData.damagedEggs = validatedData.jellyEggs
    }

    const production = await prisma.production.update({
      where: {
        id,
      },
      data: updateData,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const organizationId = await getOrganizationId(request)
    const userRole = await getUserRole(request)

    // Only OWNER and MANAGER can delete production records
    if (!["OWNER", "MANAGER"].includes(userRole)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    // Verify production record exists and belongs to the organization
    const existingProduction = await prisma.production.findFirst({
      where: {
        id,
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
        id,
      },
    })

    return createSuccessResponse(null, "Production record deleted successfully")
  } catch (error) {
    return handleApiError(error)
  }
}