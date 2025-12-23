import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId, getUserRole } from "@/lib/api-utils"
import { z } from "zod"

const updateOrganizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        website: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!organization) {
      return createErrorResponse("Organization not found", 404)
    }

    return createSuccessResponse(organization)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const userRole = await getUserRole(request)
    
    // Only OWNER can update organization settings
    if (userRole !== "OWNER") {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()
    const validatedData = updateOrganizationSchema.parse(body)

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        website: true,
        description: true,
        updatedAt: true,
      },
    })

    return createSuccessResponse(organization, "Organization updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}