import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createShedSchema } from "@/lib/validations"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId, getUserRole } from "@/lib/api-utils"

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

    const sheds = await prisma.shed.findMany({
      where: whereClause,
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        _count: {
          select: {
            productions: true,
          },
        },
      },
      orderBy: [
        { farm: { name: 'asc' } },
        { name: 'asc' },
      ],
    })

    return createSuccessResponse(sheds)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const userRole = await getUserRole(request)
    
    // Only OWNER and MANAGER can create sheds
    if (!["OWNER", "MANAGER"].includes(userRole)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()
    const validatedData = createShedSchema.parse(body)

    // Verify farm exists and belongs to the organization
    const farm = await prisma.farm.findFirst({
      where: {
        id: validatedData.farmId,
        organizationId,
      },
    })

    if (!farm) {
      return createErrorResponse("Farm not found", 404)
    }

    // Check if shed name already exists in the same farm
    const existingShed = await prisma.shed.findFirst({
      where: {
        name: validatedData.name,
        farmId: validatedData.farmId,
      },
    })

    if (existingShed) {
      return createErrorResponse("Shed with this name already exists in the farm", 400)
    }

    const shed = await prisma.shed.create({
      data: validatedData,
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        _count: {
          select: {
            productions: true,
          },
        },
      },
    })

    return createSuccessResponse(shed, "Shed created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}