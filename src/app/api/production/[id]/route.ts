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
    
    // Verify production record exists and belongs to the organization
    const existingProduction = await prisma.production.findFirst({
      where: {
        id,
        farm: {
          organizationId,
        },
      },
    })

    if (!existingProduction) {
      return createErrorResponse("Production record not found", 404)
    }

    // Calculate total eggs
    const totalEggs = (body.tableEggs || 0) + (body.hatchingEggs || 0) + 
                     (body.crackedEggs || 0) + (body.jumboEggs || 0) + (body.leakerEggs || 0)

    const updateData = {
      date: body.date ? new Date(body.date) : undefined,
      tableEggs: body.tableEggs || 0,
      hatchingEggs: body.hatchingEggs || 0,
      crackedEggs: body.crackedEggs || 0,
      jumboEggs: body.jumboEggs || 0,
      leakerEggs: body.leakerEggs || 0,
      inchargeEggs: body.inchargeEggs || 0,
      totalEggs,
      notes: body.notes,
      farmId: body.farmId,
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    const production = await prisma.production.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            location: true,
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
        farm: {
          organizationId,
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