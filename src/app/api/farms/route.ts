import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createFarmSchema } from "@/lib/validations"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId, getUserRole } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    
    const farms = await prisma.farm.findMany({
      where: {
        organizationId,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sheds: {
          select: {
            id: true,
            name: true,
            capacity: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            sheds: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return createSuccessResponse(farms)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const userRole = await getUserRole(request)
    
    // Only OWNER can create farms
    if (userRole !== "OWNER") {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()
    const validatedData = createFarmSchema.parse(body)

    // Verify manager exists and belongs to the same organization
    if (validatedData.managerId) {
      const manager = await prisma.user.findFirst({
        where: {
          id: validatedData.managerId,
          organizationId,
          role: { in: ["OWNER", "MANAGER"] },
          isActive: true,
        },
      })

      if (!manager) {
        return createErrorResponse("Invalid manager selected", 400)
      }
    }

    const farm = await prisma.farm.create({
      data: {
        ...validatedData,
        organizationId,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            sheds: true,
          },
        },
      },
    })

    return createSuccessResponse(farm, "Farm created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}