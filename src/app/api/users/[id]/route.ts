import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateUserSchema } from "@/lib/validations"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId, getUserRole, getUserId } from "@/lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = getOrganizationId(request)
    const userRole = getUserRole(request)
    const currentUserId = getUserId(request)
    const targetUserId = params.id

    // Users can view their own profile, OWNER can view all users
    if (userRole !== "OWNER" && currentUserId !== targetUserId) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const user = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return createErrorResponse("User not found", 404)
    }

    return createSuccessResponse(user)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = getOrganizationId(request)
    const userRole = getUserRole(request)
    const currentUserId = getUserId(request)
    const targetUserId = params.id

    // Users can update their own profile (limited fields), OWNER can update all users
    if (userRole !== "OWNER" && currentUserId !== targetUserId) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Verify user exists and belongs to the organization
    const existingUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        organizationId,
      },
    })

    if (!existingUser) {
      return createErrorResponse("User not found", 404)
    }

    // Non-owners can only update their own name and email
    if (userRole !== "OWNER") {
      const allowedFields = { name: validatedData.name, email: validatedData.email }
      Object.keys(validatedData).forEach(key => {
        if (!['name', 'email'].includes(key)) {
          delete (validatedData as any)[key]
        }
      })
    }

    // Check if email is already taken by another user
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: targetUserId },
        },
      })

      if (emailExists) {
        return createErrorResponse("Email is already taken", 400)
      }
    }

    const user = await prisma.user.update({
      where: {
        id: targetUserId,
      },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return createSuccessResponse(user, "User updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = getOrganizationId(request)
    const userRole = getUserRole(request)
    const currentUserId = getUserId(request)
    const targetUserId = params.id

    // Only OWNER can delete users
    if (userRole !== "OWNER") {
      return createErrorResponse("Insufficient permissions", 403)
    }

    // Cannot delete yourself
    if (currentUserId === targetUserId) {
      return createErrorResponse("Cannot delete your own account", 400)
    }

    // Verify user exists and belongs to the organization
    const existingUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        organizationId,
      },
    })

    if (!existingUser) {
      return createErrorResponse("User not found", 404)
    }

    // Instead of deleting, deactivate the user to preserve data integrity
    await prisma.user.update({
      where: {
        id: targetUserId,
      },
      data: {
        isActive: false,
      },
    })

    return createSuccessResponse(null, "User deactivated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}