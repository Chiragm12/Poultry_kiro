import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSuccessResponse, handleApiError, getOrganizationId } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    console.log("Debug: Headers:", Object.fromEntries(request.headers.entries()))
    
    const organizationId = await getOrganizationId(request)
    console.log("Debug: Organization ID:", organizationId)

    // Get all sheds for this organization
    const sheds = await prisma.shed.findMany({
      where: {
        farm: {
          organizationId,
        },
      },
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            location: true,
            organizationId: true,
          },
        },
      },
    })

    console.log("Debug: Found sheds:", sheds.length)
    console.log("Debug: Sheds data:", JSON.stringify(sheds, null, 2))

    return createSuccessResponse({
      organizationId,
      shedsCount: sheds.length,
      sheds,
    })
  } catch (error) {
    console.error("Debug error:", error)
    return handleApiError(error)
  }
}