import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSuccessResponse, createErrorResponse, handleApiError, getUserId } from "@/lib/api-utils"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
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

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Check if email is being changed and if it's already taken
    if (validatedData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: userId },
        },
      })

      if (existingUser) {
        return createErrorResponse("Email is already taken", 400)
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        updatedAt: true,
      },
    })

    return createSuccessResponse(user, "Profile updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}