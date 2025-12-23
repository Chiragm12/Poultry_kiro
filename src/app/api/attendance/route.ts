import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAttendanceSchema, bulkAttendanceSchema } from "@/lib/validations"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId, getUserRole } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const date = searchParams.get("date")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const whereClause: any = {
      user: {
        organizationId,
      },
    }

    if (userId) {
      whereClause.userId = userId
    }

    if (date) {
      whereClause.date = new Date(date)
    } else if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const [attendanceRecords, total] = await Promise.all([
      prisma.attendance.findMany({
        where: whereClause,
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
        orderBy: [
          { date: 'desc' },
          { user: { name: 'asc' } },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.attendance.count({ where: whereClause }),
    ])

    return createSuccessResponse(attendanceRecords)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const userRole = await getUserRole(request)
    
    // Debug logging
    console.log('User role from headers:', request.headers.get("x-user-role"))
    console.log('User role from getUserRole:', userRole)
    
    // Only OWNER and MANAGER can create attendance records
    if (!["OWNER", "MANAGER"].includes(userRole)) {
      console.log('Permission denied for role:', userRole)
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()
    console.log('Received body:', body)
    
    // Check if it's a bulk operation
    if (body.attendanceRecords) {
      const validatedData = bulkAttendanceSchema.parse(body)
      
      // Verify all users exist and belong to the organization
      const userIds = validatedData.attendanceRecords.map(record => record.userId)
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          organizationId,
          isActive: true,
        },
      })

      if (users.length !== userIds.length) {
        return createErrorResponse("One or more users not found", 400)
      }

      // Check for existing attendance records
      const existingRecords = await prisma.attendance.findMany({
        where: {
          userId: { in: userIds },
          date: new Date(validatedData.date),
        },
      })

      if (existingRecords.length > 0) {
        return createErrorResponse("Attendance already recorded for some users on this date", 400)
      }

      // Create bulk attendance records
      const attendanceData = validatedData.attendanceRecords.map(record => ({
        ...record,
        date: new Date(validatedData.date),
      }))

      const attendanceRecords = await prisma.attendance.createMany({
        data: attendanceData,
      })

      return createSuccessResponse(attendanceRecords, "Bulk attendance recorded successfully")
    } else {
      // Single attendance record
      const validatedData = createAttendanceSchema.parse(body)

      // Verify user exists and belongs to the organization
      const user = await prisma.user.findFirst({
        where: {
          id: validatedData.userId,
          organizationId,
          isActive: true,
        },
      })

      if (!user) {
        return createErrorResponse("User not found", 404)
      }

      // Check if attendance already exists for this user and date
      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId: validatedData.userId,
            date: new Date(validatedData.date),
          },
        },
      })

      if (existingAttendance) {
        return createErrorResponse("Attendance already recorded for this user and date", 400)
      }

      const attendance = await prisma.attendance.create({
        data: {
          ...validatedData,
          date: new Date(validatedData.date),
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

      return createSuccessResponse(attendance, "Attendance recorded successfully")
    }
  } catch (error) {
    return handleApiError(error)
  }
}