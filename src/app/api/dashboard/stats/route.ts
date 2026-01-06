import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)
    const startOfCurrentMonth = startOfMonth(today)
    const endOfCurrentMonth = endOfMonth(today)

    // Get real attendance data for today
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday
        },
        user: {
          organizationId: session.user.organizationId
        }
      },
      include: {
        user: true
      }
    })

    // Get total workers
    const totalWorkers = await prisma.user.count({
      where: {
        organizationId: session.user.organizationId,
        role: "WORKER",
        isActive: true
      }
    })

    // Calculate real attendance rate
    const presentWorkers = todayAttendance.filter(a => 
      a.status === "PRESENT" || a.status === "LATE"
    ).length
    const attendanceRate = totalWorkers > 0 ? Math.round((presentWorkers / totalWorkers) * 100) : 0

    // Get today's production
    const todayProduction = await prisma.production.findMany({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday
        },
        farm: {
          organizationId: session.user.organizationId
        }
      }
    })

    const todayTotal = todayProduction.reduce((sum, p) => 
      sum + p.tableEggs + p.hatchingEggs, 0
    )

    const todayNormalEggs = todayProduction.reduce((sum, p) => 
      sum + p.hatchingEggs, 0
    )

    // Get monthly production
    const monthlyProduction = await prisma.production.findMany({
      where: {
        date: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth
        },
        farm: {
          organizationId: session.user.organizationId
        }
      }
    })

    const monthlyTotal = monthlyProduction.reduce((sum, p) => 
      sum + p.tableEggs + p.hatchingEggs, 0
    )

    // Get farms and sheds count
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

    // Get current flock data from the latest flock management record
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

    // If no flock data, get from farm totals
    let flockData = {
      openingFemale: 0,
      openingMale: 0,
      mortalityF: 0,
      mortalityM: 0,
      closingFemale: 0,
      closingMale: 0
    }

    if (latestFlockData) {
      flockData = {
        openingFemale: latestFlockData.openingFemale,
        openingMale: latestFlockData.openingMale,
        mortalityF: latestFlockData.mortalityF,
        mortalityM: latestFlockData.mortalityM,
        closingFemale: latestFlockData.closingFemale,
        closingMale: latestFlockData.closingMale
      }
    } else {
      // Fallback to farm totals
      const farms = await prisma.farm.findMany({
        where: {
          organizationId: session.user.organizationId,
          isActive: true
        }
      })

      flockData.openingFemale = farms.reduce((sum, f) => sum + (f.femaleCount || 0), 0)
      flockData.openingMale = farms.reduce((sum, f) => sum + (f.maleCount || 0), 0)
      flockData.closingFemale = flockData.openingFemale
      flockData.closingMale = flockData.openingMale
    }

    // Get recent activity from audit logs
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        organizationId: session.user.organizationId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    const formattedActivity = recentActivity.map(log => ({
      id: log.id,
      action: `${log.action} ${log.entityType}`,
      details: log.user?.name ? `by ${log.user.name}` : 'System action',
      time: getRelativeTime(log.createdAt)
    }))

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalProduction: monthlyTotal,
          todayProduction: todayTotal,
          todayNormalEggs: todayNormalEggs,
          attendanceRate,
          activeFarms,
          activeSheds,
          totalWorkers,
          presentWorkers
        },
        flockData,
        recentActivity: formattedActivity
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

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hours ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} days ago`
}