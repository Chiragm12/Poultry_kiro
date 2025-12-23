import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createProductionSchema } from "@/lib/validations"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId, getUserRole } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const { searchParams } = new URL(request.url)
    const shedId = searchParams.get("shedId")
    const farmId = searchParams.get("farmId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

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

    if (farmId) {
      whereClause.shed.farmId = farmId
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const [productions, total] = await Promise.all([
      prisma.production.findMany({
        where: whereClause,
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
        orderBy: {
          date: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.production.count({ where: whereClause }),
    ])

    return createSuccessResponse({
      productions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const userRole = await getUserRole(request)
    
    // All authenticated users can create production records
    const body = await request.json()
    const validatedData = createProductionSchema.parse(body)

    // Verify shed exists and belongs to the organization
    const shed = await prisma.shed.findFirst({
      where: {
        id: validatedData.shedId,
        farm: {
          organizationId,
        },
      },
    })

    if (!shed) {
      return createErrorResponse("Shed not found", 404)
    }

    // Check if production record already exists for this shed and date
    const existingProduction = await prisma.production.findUnique({
      where: {
        shedId_date: {
          shedId: validatedData.shedId,
          date: new Date(validatedData.date),
        },
      },
    })

    if (existingProduction) {
      return createErrorResponse("Production record already exists for this shed and date", 400)
    }

    // Calculate sellable eggs
    const sellableEggs = validatedData.totalEggs - validatedData.brokenEggs - validatedData.damagedEggs

    const production = await prisma.production.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
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

    return createSuccessResponse(production, "Production record created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}