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

    // Check if production record already exists for this shed and date
    const existingProduction = await prisma.production.findUnique({
      where: {
        shedId_date: {
          shedId: body.shedId,
          date: new Date(body.date),
        },
      },
    })

    if (existingProduction) {
      return createErrorResponse("Production record already exists for this shed and date", 400)
    }

    // Handle new egg categorization system
    const tableEggs = body.tableEggs || 0
    const hatchingEggs = body.hatchingEggs || 0
    const crackedEggs = body.crackedEggs || 0
    const jumboEggs = body.jumboEggs || 0
    const leakerEggs = body.leakerEggs || 0
    const totalEggs = body.totalEggs || (tableEggs + hatchingEggs + crackedEggs + jumboEggs + leakerEggs)

    // Backward compatibility fields
    const normalEggs = body.normalEggs || hatchingEggs
    const commEggs = body.commEggs || tableEggs
    const waterEggs = body.waterEggs || 0
    const jellyEggs = body.jellyEggs || 0
    const creakEggs = body.creakEggs || crackedEggs
    const sellableEggs = normalEggs + commEggs

    const production = await prisma.production.create({
      data: {
        date: new Date(body.date),
        // New fields
        tableEggs,
        hatchingEggs,
        crackedEggs,
        jumboEggs,
        leakerEggs,
        totalEggs,
        // Legacy fields for backward compatibility
        normalEggs,
        commEggs,
        waterEggs,
        jellyEggs,
        creakEggs,
        sellableEggs,
        brokenEggs: crackedEggs,
        damagedEggs: leakerEggs,
        notes: body.notes,
        shedId: body.shedId,
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