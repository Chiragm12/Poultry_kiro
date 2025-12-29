import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId, getUserRole } from "@/lib/api-utils"
import { z } from "zod"

const updateAttendanceSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "LATE", "SICK_LEAVE", "VACATION"]),
  notes: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const organizationId = await getOrganizationId(request)
    const userRole = await getUserRole(request)
    
    // Only OWNER and MANAGER can update attendance records
    if (!["OWNER", "MANAGER"].includes(userRole)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()
    const validatedData = updateAttendanceSchema.parse(body)

    // Check if attendance record exists and belongs to the organization
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        id,
        user: {
          organizationId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    if (!existingAttendance) {
      return createErrorResponse("Attendance record not found", 404)
    }

    // Update the attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: {
        id,
      },
      data: {
        status: validatedData.status,
        notes: validatedData.notes,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    return createSuccessResponse(updatedAttendance, "Attendance updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const organizationId = await getOrganizationId(request)
    const userRole = await getUserRole(request)
    
    // Only OWNER and MANAGER can delete attendance records
    if (!["OWNER", "MANAGER"].includes(userRole)) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    // Check if attendance record exists and belongs to the organization
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        id,
        user: {
          organizationId,
        },
      },
    })

    if (!existingAttendance) {
      return createErrorResponse("Attendance record not found", 404)
    }

    // Delete the attendance record
    await prisma.attendance.delete({
      where: {
        id,
      },
    })

    return createSuccessResponse(null, "Attendance record deleted successfully")
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const organizationId = await getOrganizationId(request)

    // Get specific attendance record
    const attendance = await prisma.attendance.findFirst({
      where: {
        id,
        user: {
          organizationId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    if (!attendance) {
      return createErrorResponse("Attendance record not found", 404)
    }

    return createSuccessResponse(attendance)
  } catch (error) {
    return handleApiError(error)
  }
}