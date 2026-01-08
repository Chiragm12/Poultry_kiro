import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSuccessResponse, createErrorResponse, handleApiError, getUserId } from "@/lib/api-utils"
import { z } from "zod"

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  productionAlerts: z.boolean().optional(),
  attendanceAlerts: z.boolean().optional(),
  lowProductionThreshold: z.number().min(0).max(100).optional(),
  attendanceThreshold: z.number().min(0).max(100).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    
    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!user) {
      return createErrorResponse("User not found", 404)
    }
    
    // Check if user has notification settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: {
        emailNotifications: true,
        smsNotifications: true,
        productionAlerts: true,
        attendanceAlerts: true,
        lowProductionThreshold: true,
        attendanceThreshold: true,
      },
    })

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId,
          emailNotifications: true,
          smsNotifications: false,
          productionAlerts: true,
          attendanceAlerts: true,
          lowProductionThreshold: 80,
          attendanceThreshold: 85,
        },
        select: {
          emailNotifications: true,
          smsNotifications: true,
          productionAlerts: true,
          attendanceAlerts: true,
          lowProductionThreshold: true,
          attendanceThreshold: true,
        },
      })
    }

    return createSuccessResponse(settings)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const body = await request.json()
    const validatedData = notificationSettingsSchema.parse(body)

    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!user) {
      return createErrorResponse("User not found", 404)
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: validatedData,
      create: {
        userId,
        ...validatedData,
      },
      select: {
        emailNotifications: true,
        smsNotifications: true,
        productionAlerts: true,
        attendanceAlerts: true,
        lowProductionThreshold: true,
        attendanceThreshold: true,
      },
    })

    return createSuccessResponse(settings, "Notification settings updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}