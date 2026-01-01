import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const { searchParams } = new URL(request.url)
    const shedId = searchParams.get("shedId")

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

    const flockRecords = await prisma.flockManagement.findMany({
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

    return createSuccessResponse(flockRecords)
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
        shedId: body.shedId,
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

    return createSuccessResponse(flockRecord, "Flock management record created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}