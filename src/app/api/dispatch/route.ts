import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get("farmId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const whereClause: any = {
      farm: {
        organizationId,
      },
    }

    if (farmId) {
      whereClause.farmId = farmId
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const dispatchRecords = await prisma.dispatchRecord.findMany({
      where: whereClause,
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return createSuccessResponse(dispatchRecords)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const body = await request.json()

    if (!body.farmId) {
      return createErrorResponse("Farm ID is required", 400)
    }

    // Verify farm exists and belongs to the organization
    const farm = await prisma.farm.findFirst({
      where: {
        id: body.farmId,
        organizationId,
      },
    })

    if (!farm) {
      return createErrorResponse("Farm not found", 404)
    }

    const tableEggs = parseInt(body.tableEggs) || 0
    const hatchingEggs = parseInt(body.hatchingEggs) || 0
    const crackedEggs = parseInt(body.crackedEggs) || 0
    const jumboEggs = parseInt(body.jumboEggs) || 0
    const leakerEggs = parseInt(body.leakerEggs) || 0
    const totalDispatched = tableEggs + hatchingEggs + crackedEggs + jumboEggs + leakerEggs

    const dispatchRecord = await prisma.dispatchRecord.create({
      data: {
        date: new Date(body.date),
        tableEggs,
        hatchingEggs,
        crackedEggs,
        jumboEggs,
        leakerEggs,
        totalDispatched,
        notes: body.notes,
        farmId: body.farmId,
        productionId: body.productionId,
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

    return createSuccessResponse(dispatchRecord, "Dispatch record created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}