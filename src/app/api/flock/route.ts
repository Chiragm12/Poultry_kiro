import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get("farmId")

    const whereClause: any = {
      farm: {
        organizationId,
      },
    }

    if (farmId) {
      whereClause.farmId = farmId
    }

    const flockRecords = await prisma.flockManagement.findMany({
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

    return createSuccessResponse(flockRecords)
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

    const openingFemale = parseInt(body.openingFemale) || 0
    const openingMale = parseInt(body.openingMale) || 0
    const mortalityF = parseInt(body.mortalityF) || 0
    const mortalityM = parseInt(body.mortalityM) || 0
    const closingFemale = openingFemale - mortalityF
    const closingMale = openingMale - mortalityM

    const flockRecord = await prisma.flockManagement.create({
      data: {
        date: new Date(body.date),
        ageWeeks: parseInt(body.ageWeeks) || 0,
        ageDayOfWeek: parseInt(body.ageDayOfWeek) || 1,
        openingFemale,
        openingMale,
        mortalityF,
        mortalityM,
        closingFemale,
        closingMale,
        farmId: body.farmId,
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

    return createSuccessResponse(flockRecord, "Flock management record created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}