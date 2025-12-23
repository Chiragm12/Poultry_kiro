import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSuccessResponse, createErrorResponse, handleApiError, getUserId } from "@/lib/api-utils"
import { hashPassword, verifyPassword } from "@/lib/password"
import { z } from "zod"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
})

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const body = await request.json()
    const validatedData = changePasswordSchema.parse(body)

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        hashedPassword: true,
      },
    })

    if (!user || !user.hashedPassword) {
      return createErrorResponse("User not found or password not set", 404)
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      validatedData.currentPassword,
      user.hashedPassword
    )

    if (!isCurrentPasswordValid) {
      return createErrorResponse("Current password is incorrect", 400)
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(validatedData.newPassword)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        hashedPassword: hashedNewPassword,
        updatedAt: new Date(),
      },
    })

    return createSuccessResponse(null, "Password changed successfully")
  } catch (error) {
    return handleApiError(error)
  }
}