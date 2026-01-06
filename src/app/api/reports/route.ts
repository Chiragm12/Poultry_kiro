import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format, parseISO } from "date-fns"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to view reports
    if (!["OWNER", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { reportType, startDate, endDate, farmId, shedId, managerId } = body

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    const start = parseISO(startDate)
    const end = parseISO(endDate)

    // Build where clause based on filters
    const whereClause: any = {
      date: {
        gte: start,
        lte: end,
      },
    }

    // Add organization filter
    if (session.user.role === "MANAGER") {
      whereClause.farm = {
        organizationId: session.user.organizationId,
      }
    } else if (session.user.organizationId) {
      whereClause.farm = {
        organizationId: session.user.organizationId,
      }
    }

    // Add farm filter
    if (farmId) {
      whereClause.farmId = farmId
    }

    let reportData: any = {
      metadata: {
        reportType: reportType || "comprehensive",
        organizationName: session.user.organizationName || "Unknown Organization",
        dateRange: `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`,
        generatedAt: new Date().toISOString(),
        generatedBy: session.user.name,
      },
    }

    // Generate production data
    if (reportType === "comprehensive" || reportType === "production") {
      const productionData = await generateProductionReport(whereClause, start, end)
      reportData.production = productionData
    }

    // Generate attendance data
    if (reportType === "comprehensive" || reportType === "attendance") {
      const attendanceData = await generateAttendanceReport(session.user.organizationId, start, end, managerId)
      reportData.attendance = attendanceData
    }

    // Generate insights
    if (reportType === "comprehensive") {
      const insights = await generateInsights(reportData)
      reportData.insights = insights
    }

    return NextResponse.json({ data: reportData })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}

async function generateProductionReport(whereClause: any, startDate: Date, endDate: Date) {
  try {
    // Update whereClause to use farm instead of shed
    const farmWhereClause = {
      ...whereClause,
      farm: whereClause.shed?.farm || whereClause.farm
    }
    delete farmWhereClause.shed

    // Get production records with farm data
    const productionRecords = await prisma.production.findMany({
      where: farmWhereClause,
      include: {
        farm: true,
        mortalityRecords: true,
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Get flock management data for age calculations
    const flockRecords = await prisma.flockManagement.findMany({
      where: {
        farm: farmWhereClause.farm,
        date: {
          gte: startDate,
          lte: endDate,
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Get all users in the organization for labor counts
    const allUsers = await prisma.user.findMany({
      where: {
        organizationId: farmWhereClause.farm?.organizationId,
        isActive: true
      }
    })

    // Count total workers and supervisors
    const totalWorkers = allUsers.filter(user => user.role === 'WORKER').length
    const totalSupervisors = allUsers.filter(user => user.role === 'MANAGER' || user.role === 'OWNER').length
    const totalLabourers = allUsers.length // All users

    // Get attendance data for present worker counts
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        user: farmWhereClause.farm ? {
          organizationId: farmWhereClause.farm.organizationId
        } : undefined
      },
      include: {
        user: true
      }
    })

    // Calculate summary
    const summary = {
      totalEggs: 0,
      sellableEggs: 0,
      brokenEggs: 0,
      damagedEggs: 0,
      lossPercentage: 0,
      averageDaily: 0,
    }

    const farmBreakdown: any[] = []
    const farmMap = new Map()

    // Create detailed production data matching the image format
    const productionDetails: any[] = []

    productionRecords.forEach((record) => {
      // Find corresponding flock data
      const flockData = flockRecords.find(f =>
        f.date.toDateString() === record.date.toDateString() &&
        f.farmId === record.farmId
      )

      // Find mortality data for the same date
      const mortalityData = record.mortalityRecords.find(m =>
        m.date.toDateString() === record.date.toDateString()
      )

      // Find attendance data for the same date
      const dayAttendance = attendanceRecords.filter(a =>
        a.date.toDateString() === record.date.toDateString()
      )

      // Count present workers for this specific date
      const presentWorkers = dayAttendance.filter(a =>
        a.status === 'PRESENT' || a.status === 'LATE'
      ).length

      // Calculate flock numbers
      let openingMale = 0
      let openingFemale = 0
      let mortalityMale = mortalityData?.maleMortality || 0
      let mortalityFemale = mortalityData?.femaleMortality || 0
      let closingMale = 0
      let closingFemale = 0

      if (flockData) {
        // Use flock management data if available
        openingMale = flockData.openingMale
        openingFemale = flockData.openingFemale
        closingMale = flockData.closingMale
        closingFemale = flockData.closingFemale
      } else {
        // Fallback: use farm's current counts and calculate based on mortality
        openingMale = record.farm.maleCount || 0
        openingFemale = record.farm.femaleCount || 0
        closingMale = Math.max(0, openingMale - mortalityMale)
        closingFemale = Math.max(0, openingFemale - mortalityFemale)
      }

      // Calculate totals
      const totalDailyEggs = record.tableEggs + record.hatchingEggs + record.crackedEggs + record.jumboEggs + record.leakerEggs
      const sellableEggs = record.tableEggs + record.hatchingEggs + record.jumboEggs
      const wasteEggs = record.crackedEggs + record.leakerEggs

      // Calculate percentages
      const hdPercentage = totalDailyEggs > 0 ? ((sellableEggs / totalDailyEggs) * 100).toFixed(1) : '0.0'
      const hePercentage = totalDailyEggs > 0 ? ((record.hatchingEggs / totalDailyEggs) * 100).toFixed(1) : '0.0'

      // Expected percentages (these would typically come from breed standards or targets)
      const expHdPercentage = '92.0' // Expected HD percentage
      const expHePercentage = '85.0' // Expected HE percentage

      const detailRecord = {
        date: record.date.toISOString().split('T')[0],
        ageWeeks: flockData?.ageWeeks || '',
        ageDays: flockData?.ageDayOfWeek || '',
        openingMale: openingMale,
        openingFemale: openingFemale,
        mortalityMale: mortalityMale,
        mortalityFemale: mortalityFemale,
        closingMale: closingMale,
        closingFemale: closingFemale,
        tableEggs: record.tableEggs,
        hatchingEggs: record.hatchingEggs,
        crackedEggs: record.crackedEggs,
        jumboEggs: record.jumboEggs,
        leakerEggs: record.leakerEggs,
        waterEggs: 0, // Not used in current schema
        totalDailyEggs: totalDailyEggs,
        inchargeHE: record.inchargeEggs || 0,
        dailyHE: record.hatchingEggs,
        totalLabors: totalLabourers, // Total number of users created
        presentLabors: presentWorkers, // Workers present on this specific date
        supervisors: totalSupervisors, // Total number of managers/owners
        depHE: 0, // Dispatched HE - would need dispatch data
        hdPercentage: hdPercentage,
        hePercentage: hePercentage,
        expHdPercentage: expHdPercentage,
        expHePercentage: expHePercentage
      }

      productionDetails.push(detailRecord)

      // Add to summary
      summary.totalEggs += totalDailyEggs
      summary.sellableEggs += sellableEggs
      summary.brokenEggs += record.crackedEggs
      summary.damagedEggs += record.leakerEggs

      // Add to farm breakdown
      const farmKey = record.farmId
      if (!farmMap.has(farmKey)) {
        farmMap.set(farmKey, {
          farmId: record.farmId,
          farmName: record.farm.name,
          totalEggs: 0,
          sellableEggs: 0,
          brokenEggs: 0,
          damagedEggs: 0,
          efficiency: 0,
        })
      }

      const farmData = farmMap.get(farmKey)
      farmData.totalEggs += totalDailyEggs
      farmData.sellableEggs += sellableEggs
      farmData.brokenEggs += record.crackedEggs
      farmData.damagedEggs += record.leakerEggs
      farmData.efficiency = farmData.totalEggs > 0 ? (farmData.sellableEggs / farmData.totalEggs) * 100 : 0
    })

    // Calculate percentages and averages
    summary.lossPercentage = summary.totalEggs > 0 ? ((summary.brokenEggs + summary.damagedEggs) / summary.totalEggs) * 100 : 0

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1
    summary.averageDaily = summary.totalEggs / daysDiff

    return {
      summary,
      farmBreakdown: Array.from(farmMap.values()),
      productionDetails, // Add the detailed data for CSV export
    }
  } catch (error) {
    console.error("Error generating production report:", error)
    return {
      summary: {
        totalEggs: 0,
        sellableEggs: 0,
        brokenEggs: 0,
        damagedEggs: 0,
        lossPercentage: 0,
        averageDaily: 0,
      },
      farmBreakdown: [],
      productionDetails: [],
    }
  }
}

async function generateAttendanceReport(organizationId: string | undefined, startDate: Date, endDate: Date, managerId?: string) {
  try {
    // Build where clause for attendance
    const attendanceWhere: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (organizationId) {
      attendanceWhere.user = {
        organizationId: organizationId,
      }
    }

    if (managerId) {
      attendanceWhere.userId = managerId
    }

    // Get attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where: attendanceWhere,
      include: {
        user: true,
      },
    })

    // Get all users in the organization for the period
    const userWhere: any = {}
    if (organizationId) {
      userWhere.organizationId = organizationId
    }
    if (managerId) {
      userWhere.id = managerId
    }

    const users = await prisma.user.findMany({
      where: userWhere,
    })

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1

    // Calculate summary
    const summary = {
      totalWorkers: users.length,
      averageAttendanceRate: 0,
      totalPresentDays: 0,
      totalLateDays: 0,
      totalAbsentDays: 0,
    }

    const workerBreakdown: any[] = []
    const userMap = new Map()

    // Initialize user data
    users.forEach((user) => {
      userMap.set(user.id, {
        userId: user.id,
        userName: user.name,
        totalDays: daysDiff,
        presentDays: 0,
        lateDays: 0,
        absentDays: daysDiff, // Start with all days as absent
        attendanceRate: 0,
        status: 'needs-improvement',
      })
    })

    // Process attendance records
    attendanceRecords.forEach((record) => {
      if (userMap.has(record.userId)) {
        const userData = userMap.get(record.userId)

        if (record.status === 'PRESENT') {
          userData.presentDays += 1
          userData.absentDays -= 1
        } else if (record.status === 'LATE') {
          userData.lateDays += 1
          userData.absentDays -= 1
        }
        // ABSENT records don't change absentDays (already counted)
      }
    })

    // Calculate rates and status
    let totalAttendanceRate = 0
    userMap.forEach((userData) => {
      const attendedDays = userData.presentDays + userData.lateDays
      userData.attendanceRate = userData.totalDays > 0 ? (attendedDays / userData.totalDays) * 100 : 0

      // Determine status
      if (userData.attendanceRate >= 95) {
        userData.status = 'excellent'
      } else if (userData.attendanceRate >= 85) {
        userData.status = 'good'
      } else {
        userData.status = 'needs-improvement'
      }

      totalAttendanceRate += userData.attendanceRate
      summary.totalPresentDays += userData.presentDays
      summary.totalLateDays += userData.lateDays
      summary.totalAbsentDays += userData.absentDays
    })

    summary.averageAttendanceRate = users.length > 0 ? totalAttendanceRate / users.length : 0

    return {
      summary,
      workerBreakdown: Array.from(userMap.values()),
    }
  } catch (error) {
    console.error("Error generating attendance report:", error)
    return {
      summary: {
        totalWorkers: 0,
        averageAttendanceRate: 0,
        totalPresentDays: 0,
        totalLateDays: 0,
        totalAbsentDays: 0,
      },
      workerBreakdown: [],
    }
  }
}

async function generateInsights(reportData: any) {
  const insights: any = {}

  // Production insights
  if (reportData.production) {
    const { summary, shedBreakdown } = reportData.production

    let productionTrend = "Production data is being analyzed."

    if (summary.lossPercentage > 10) {
      productionTrend = `High loss rate detected (${summary.lossPercentage.toFixed(1)}%). Consider reviewing egg handling procedures and storage conditions.`
    } else if (summary.lossPercentage < 3) {
      productionTrend = `Excellent loss rate (${summary.lossPercentage.toFixed(1)}%). Current procedures are working well.`
    } else {
      productionTrend = `Loss rate is within acceptable range (${summary.lossPercentage.toFixed(1)}%). Continue monitoring for improvements.`
    }

    insights.productionTrends = {
      description: productionTrend,
    }
  }

  // Attendance insights
  if (reportData.attendance) {
    const { summary } = reportData.attendance

    let attendanceInsight = "Attendance data is being analyzed."

    if (summary.averageAttendanceRate > 95) {
      attendanceInsight = `Excellent attendance rate (${summary.averageAttendanceRate.toFixed(1)}%). Team is highly engaged.`
    } else if (summary.averageAttendanceRate > 85) {
      attendanceInsight = `Good attendance rate (${summary.averageAttendanceRate.toFixed(1)}%). Consider incentives for improvement.`
    } else {
      attendanceInsight = `Attendance rate needs improvement (${summary.averageAttendanceRate.toFixed(1)}%). Review policies and address issues.`
    }

    insights.attendanceInsights = {
      description: attendanceInsight,
    }
  }

  // Generate recommendations
  const recommendations: string[] = []

  if (reportData.production?.summary.lossPercentage > 8) {
    recommendations.push("Implement better egg handling training for workers")
    recommendations.push("Review and upgrade egg storage facilities")
  }

  if (reportData.attendance?.summary.averageAttendanceRate < 90) {
    recommendations.push("Implement attendance incentive programs")
    recommendations.push("Review work schedules and conditions")
  }

  if (reportData.production?.summary.averageDaily < 1000) {
    recommendations.push("Analyze feed quality and nutrition programs")
    recommendations.push("Review flock health and vaccination schedules")
  }

  if (recommendations.length === 0) {
    recommendations.push("Continue current excellent practices")
    recommendations.push("Monitor trends for continuous improvement")
  }

  insights.recommendations = recommendations

  return insights
}