import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const { searchParams } = new URL(request.url)
    const shedId = searchParams.get("shedId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const whereClause: any = {
      shed: {
        farm: {
          organizationId,
        },
      },
    }

    if (shedId) {
      whereClause.shedId = shedId
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const mortalityRecords = await prisma.mortalityRecord.findMany({
      where: whereClause,
      include: {
        shed: {
          select: {
            id: true,
            name: true,
            farm: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return createSuccessResponse(mortalityRecords)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const body = await request.json()

    // Verify shed exists and belongs to the organization
    const shed = await prisma.shed.findFirst({
      where: {
        id: body.shedId,
        farm: {
          organizationId,
        },
      },
    })

    if (!shed) {
      return createErrorResponse("Shed not found", 404)
    }

    const mortalityRecord = await prisma.mortalityRecord.create({
      data: {
        date: new Date(body.date),
        maleMortality: parseInt(body.maleMortality) || 0,
        femaleMortality: parseInt(body.femaleMortality) || 0,
        notes: body.notes,
        shedId: body.shedId,
        productionId: body.productionId,
      },
      include: {
        shed: {
          select: {
            id: true,
            name: true,
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

    return createSuccessResponse(mortalityRecord, "Mortality record created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}