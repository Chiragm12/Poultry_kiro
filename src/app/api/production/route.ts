import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createProductionSchema } from "@/lib/validations"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId, getUserRole } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get("farmId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

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

    const [productions, total] = await Promise.all([
      prisma.production.findMany({
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

    // Check if production record already exists for this farm and date
    const existingProduction = await prisma.production.findUnique({
      where: {
        farmId_date: {
          farmId: body.farmId,
          date: new Date(body.date),
        },
      },
    })

    if (existingProduction) {
      return createErrorResponse("Production record already exists for this farm and date", 400)
    }

    // Handle new egg categorization system
    const tableEggs = body.tableEggs || 0
    const hatchingEggs = body.hatchingEggs || 0
    const crackedEggs = body.crackedEggs || 0
    const jumboEggs = body.jumboEggs || 0
    const leakerEggs = body.leakerEggs || 0
    const inchargeEggs = body.inchargeEggs || 0
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
        inchargeEggs,
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

    return createSuccessResponse(production, "Production record created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}