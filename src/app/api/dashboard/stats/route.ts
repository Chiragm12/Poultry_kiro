import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, subDays, format } from "date-fns"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())

    // Get today's production
    const todayProduction = await prisma.production.aggregate({
      where: {
        farm: {
          organizationId: session.user.organizationId
        },
        date: {
          gte: today,
          lte: todayEnd
        }
      },
      _sum: {
        tableEggs: true,
        hatchingEggs: true,
        totalEggs: true
      }
    })

    // Get farm and shed counts
    const [activeFarms, activeSheds] = await Promise.all([
      prisma.farm.count({
        where: {
          organizationId: session.user.organizationId,
          isActive: true
        }
      }),
      prisma.shed.count({
        where: {
          farm: {
            organizationId: session.user.organizationId,
            isActive: true
          },
          isActive: true
        }
      })
    ])

    // Get worker count and attendance
    const totalWorkers = await prisma.user.count({
      where: {
        organizationId: session.user.organizationId,
        role: "WORKER",
        isActive: true
      }
    })

    // Get today's attendance
    const todayAttendance = await prisma.attendance.count({
      where: {
        user: { organizationId: session.user.organizationId },
        date: today,
        status: { in: ["PRESENT", "LATE"] }
      }
    })

    const attendanceRate = totalWorkers > 0 ? Math.round((todayAttendance / totalWorkers) * 100) : 0

    // Get latest flock data
    const latestFlockData = await prisma.flockManagement.findFirst({
      where: {
        farm: {
          organizationId: session.user.organizationId
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Generate recent activity
    const recentActivity = [
      {
        id: "1",
        action: "Production recorded",
        details: `${(todayProduction._sum.tableEggs || 0) + (todayProduction._sum.hatchingEggs || 0)} eggs today`,
        time: "2 hours ago"
      },
      {
        id: "2",
        action: "Attendance marked",
        details: `${todayAttendance} workers present`,
        time: "3 hours ago"
      },
      {
        id: "3",
        action: "Farms active",
        details: `${activeFarms} farms, ${activeSheds} sheds`,
        time: "1 day ago"
      }
    ]

    const stats = {
      totalProduction: (todayProduction._sum.totalEggs || 0),
      todayProduction: (todayProduction._sum.tableEggs || 0) + (todayProduction._sum.hatchingEggs || 0),
      todayNormalEggs: todayProduction._sum.hatchingEggs || 0,
      attendanceRate,
      activeFarms,
      activeSheds,
      totalWorkers,
      presentWorkers: todayAttendance,
    }

    const flockData = {
      openingFemale: latestFlockData?.openingFemale || 0,
      openingMale: latestFlockData?.openingMale || 0,
      mortalityF: latestFlockData?.mortalityF || 0,
      mortalityM: latestFlockData?.mortalityM || 0,
      closingFemale: latestFlockData?.closingFemale || 0,
      closingMale: latestFlockData?.closingMale || 0,
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        flockData,
        recentActivity
      }
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    )
  }
}