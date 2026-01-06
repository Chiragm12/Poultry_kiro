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

    const mortalityRecords = await prisma.mortalityRecord.findMany({
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

    return createSuccessResponse(mortalityRecords)
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

    const maleMortality = parseInt(body.maleMortality) || 0
    const femaleMortality = parseInt(body.femaleMortality) || 0

    // Create mortality record and update farm counts in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the mortality record
      const mortalityRecord = await tx.mortalityRecord.create({
        data: {
          date: new Date(body.date),
          maleMortality,
          femaleMortality,
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

      // Update farm counts by subtracting mortality
      const updatedFarm = await tx.farm.update({
        where: { id: body.farmId },
        data: {
          maleCount: Math.max(0, (farm.maleCount || 0) - maleMortality),
          femaleCount: Math.max(0, (farm.femaleCount || 0) - femaleMortality),
        },
      })

      return { mortalityRecord, updatedFarm }
    })

    return createSuccessResponse(result.mortalityRecord, "Mortality record created and farm counts updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}