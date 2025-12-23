import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSuccessResponse, createErrorResponse, handleApiError, getUserId } from "@/lib/api-utils"
import { z } from "zod"

const systemSettingsSchema = z.object({
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
  theme: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    
    // Check if user has system settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: {
        timezone: true,
        dateFormat: true,
        currency: true,
        language: true,
        theme: true,
      },
    })

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId,
          timezone: "UTC",
          dateFormat: "MM/DD/YYYY",
          currency: "USD",
          language: "en",
          theme: "light",
        },
        select: {
          timezone: true,
          dateFormat: true,
          currency: true,
          language: true,
          theme: true,
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
    const validatedData = systemSettingsSchema.parse(body)

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: validatedData,
      create: {
        userId,
        ...validatedData,
      },
      select: {
        timezone: true,
        dateFormat: true,
        currency: true,
        language: true,
        theme: true,
      },
    })

    return createSuccessResponse(settings, "System settings updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}