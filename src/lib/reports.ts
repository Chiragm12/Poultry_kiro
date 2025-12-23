import { prisma } from "./prisma"
import { startOfDay, endOfDay, subDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"

export interface ReportFilters {
  startDate: Date
  endDate: Date
  farmId?: string
  shedId?: string
  managerId?: string
}

export interface ProductionReport {
  summary: {
    totalEggs: number
    sellableEggs: number
    brokenEggs: number
    damagedEggs: number
    lossPercentage: number
    averageDaily: number
    daysReported: number
  }
  dailyData: Array<{
    date: string
    totalEggs: number
    sellableEggs: number
    brokenEggs: number
    damagedEggs: number
    lossPercentage: number
  }>
  shedBreakdown: Array<{
    shedId: string
    shedName: string
    farmName: string
    totalEggs: number
    sellableEggs: number
    efficiency: number
    capacity: number
  }>
}

export interface AttendanceReport {
  summary: {
    totalWorkers: number
    averageAttendanceRate: number
    totalWorkingDays: number
    totalPresentDays: number
    totalAbsentDays: number
    totalLateDays: number
  }
  workerBreakdown: Array<{
    userId: string
    userName: string
    totalDays: number
    presentDays: number
    absentDays: number
    lateDays: number
    attendanceRate: number
    status: 'excellent' | 'good' | 'needs_improvement'
  }>
  dailyAttendance: Array<{
    date: string
    totalWorkers: number
    presentWorkers: number
    absentWorkers: number
    lateWorkers: number
    attendanceRate: number
  }>
}

export interface ComprehensiveReport {
  metadata: {
    organizationName: string
    reportType: string
    dateRange: string
    generatedAt: Date
    generatedBy: string
  }
  production: ProductionReport
  attendance: AttendanceReport
  insights: {
    topPerformingSheds: Array<{
      shedName: string
      farmName: string
      efficiency: number
      totalProduction: number
    }>
    productionTrends: {
      trend: 'increasing' | 'decreasing' | 'stable'
      changePercentage: number
      description: string
    }
    attendanceInsights: {
      trend: 'improving' | 'declining' | 'stable'
      changePercentage: number
      description: string
    }
    recommendations: string[]
  }
}

export class ReportService {
  constructor(private organizationId: string) {}

  async generateProductionReport(filters: ReportFilters): Promise<ProductionReport> {
    const whereClause: any = {
      shed: {
        farm: { organizationId: this.organizationId }
      },
      date: {
        gte: startOfDay(filters.startDate),
        lte: endOfDay(filters.endDate)
      }
    }

    if (filters.farmId) {
      whereClause.shed.farmId = filters.farmId
    }

    if (filters.shedId) {
      whereClause.shedId = filters.shedId
    }

    // Get production data
    const productions = await prisma.production.findMany({
      where: whereClause,
      include: {
        shed: {
          include: {
            farm: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    // Calculate summary
    const summary = productions.reduce(
      (acc, prod) => ({
        totalEggs: acc.totalEggs + prod.totalEggs,
        sellableEggs: acc.sellableEggs + prod.sellableEggs,
        brokenEggs: acc.brokenEggs + prod.brokenEggs,
        damagedEggs: acc.damagedEggs + prod.damagedEggs
      }),
      { totalEggs: 0, sellableEggs: 0, brokenEggs: 0, damagedEggs: 0 }
    )

    const lossPercentage = summary.totalEggs > 0 
      ? ((summary.brokenEggs + summary.damagedEggs) / summary.totalEggs) * 100 
      : 0

    const uniqueDates = new Set(productions.map(p => format(p.date, 'yyyy-MM-dd')))
    const daysReported = uniqueDates.size
    const averageDaily = daysReported > 0 ? summary.sellableEggs / daysReported : 0

    // Group by date for daily data
    const dailyGroups = productions.reduce((acc, prod) => {
      const dateKey = format(prod.date, 'yyyy-MM-dd')
      if (!acc[dateKey]) {
        acc[dateKey] = { totalEggs: 0, sellableEggs: 0, brokenEggs: 0, damagedEggs: 0 }
      }
      acc[dateKey].totalEggs += prod.totalEggs
      acc[dateKey].sellableEggs += prod.sellableEggs
      acc[dateKey].brokenEggs += prod.brokenEggs
      acc[dateKey].damagedEggs += prod.damagedEggs
      return acc
    }, {} as Record<string, any>)

    const dailyData = Object.entries(dailyGroups).map(([date, data]) => ({
      date,
      ...data,
      lossPercentage: data.totalEggs > 0 ? ((data.brokenEggs + data.damagedEggs) / data.totalEggs) * 100 : 0
    }))

    // Group by shed for breakdown
    const shedGroups = productions.reduce((acc, prod) => {
      const shedKey = prod.shedId
      if (!acc[shedKey]) {
        acc[shedKey] = {
          shedId: prod.shedId,
          shedName: prod.shed.name,
          farmName: prod.shed.farm.name,
          capacity: prod.shed.capacity,
          totalEggs: 0,
          sellableEggs: 0
        }
      }
      acc[shedKey].totalEggs += prod.totalEggs
      acc[shedKey].sellableEggs += prod.sellableEggs
      return acc
    }, {} as Record<string, any>)

    const shedBreakdown = Object.values(shedGroups).map((shed: any) => ({
      ...shed,
      efficiency: shed.capacity > 0 ? (shed.sellableEggs / daysReported / shed.capacity) * 100 : 0
    }))

    return {
      summary: {
        ...summary,
        lossPercentage,
        averageDaily,
        daysReported
      },
      dailyData,
      shedBreakdown
    }
  }

  async generateAttendanceReport(filters: ReportFilters): Promise<AttendanceReport> {
    const whereClause: any = {
      user: { 
        organizationId: this.organizationId,
        role: 'WORKER',
        isActive: true
      },
      date: {
        gte: startOfDay(filters.startDate),
        lte: endOfDay(filters.endDate)
      }
    }

    if (filters.managerId) {
      // Filter by workers under a specific manager (if farm management is implemented)
      whereClause.user.managerId = filters.managerId
    }

    // Get attendance data
    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { date: 'asc' }
    })

    // Get all workers for the period
    const workers = await prisma.user.findMany({
      where: {
        organizationId: this.organizationId,
        role: 'WORKER',
        isActive: true
      },
      select: { id: true, name: true, email: true }
    })

    // Calculate summary
    const totalWorkers = workers.length
    const totalPresentDays = attendanceRecords.filter(a => a.status === 'PRESENT').length
    const totalAbsentDays = attendanceRecords.filter(a => a.status === 'ABSENT').length
    const totalLateDays = attendanceRecords.filter(a => a.status === 'LATE').length
    const totalWorkingDays = attendanceRecords.length
    const averageAttendanceRate = totalWorkingDays > 0 
      ? ((totalPresentDays + totalLateDays) / totalWorkingDays) * 100 
      : 0

    // Worker breakdown
    const workerGroups = workers.map(worker => {
      const workerRecords = attendanceRecords.filter(a => a.userId === worker.id)
      const presentDays = workerRecords.filter(a => a.status === 'PRESENT').length
      const absentDays = workerRecords.filter(a => a.status === 'ABSENT').length
      const lateDays = workerRecords.filter(a => a.status === 'LATE').length
      const totalDays = workerRecords.length
      const attendanceRate = totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 0

      let status: 'excellent' | 'good' | 'needs_improvement'
      if (attendanceRate >= 95) status = 'excellent'
      else if (attendanceRate >= 85) status = 'good'
      else status = 'needs_improvement'

      return {
        userId: worker.id,
        userName: worker.name || worker.email,
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendanceRate,
        status
      }
    })

    // Daily attendance
    const dailyGroups = attendanceRecords.reduce((acc, record) => {
      const dateKey = format(record.date, 'yyyy-MM-dd')
      if (!acc[dateKey]) {
        acc[dateKey] = { present: 0, absent: 0, late: 0, total: 0 }
      }
      if (record.status === 'PRESENT') acc[dateKey].present++
      else if (record.status === 'ABSENT') acc[dateKey].absent++
      else if (record.status === 'LATE') acc[dateKey].late++
      acc[dateKey].total++
      return acc
    }, {} as Record<string, any>)

    const dailyAttendance = Object.entries(dailyGroups).map(([date, data]) => ({
      date,
      totalWorkers: data.total,
      presentWorkers: data.present,
      absentWorkers: data.absent,
      lateWorkers: data.late,
      attendanceRate: data.total > 0 ? ((data.present + data.late) / data.total) * 100 : 0
    }))

    return {
      summary: {
        totalWorkers,
        averageAttendanceRate,
        totalWorkingDays,
        totalPresentDays,
        totalAbsentDays,
        totalLateDays
      },
      workerBreakdown: workerGroups,
      dailyAttendance
    }
  }

  async generateComprehensiveReport(
    filters: ReportFilters,
    generatedBy: string
  ): Promise<ComprehensiveReport> {
    // Get organization info
    const organization = await prisma.organization.findUnique({
      where: { id: this.organizationId },
      select: { name: true }
    })

    const [productionReport, attendanceReport] = await Promise.all([
      this.generateProductionReport(filters),
      this.generateAttendanceReport(filters)
    ])

    // Generate insights
    const topPerformingSheds = productionReport.shedBreakdown
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 5)
      .map(shed => ({
        shedName: shed.shedName,
        farmName: shed.farmName,
        efficiency: shed.efficiency,
        totalProduction: shed.sellableEggs
      }))

    // Calculate trends (simplified - compare first and last week)
    const dailyData = productionReport.dailyData
    const firstWeekAvg = dailyData.slice(0, 7).reduce((sum, day) => sum + day.sellableEggs, 0) / 7
    const lastWeekAvg = dailyData.slice(-7).reduce((sum, day) => sum + day.sellableEggs, 0) / 7
    const productionChange = firstWeekAvg > 0 ? ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100 : 0

    let productionTrend: 'increasing' | 'decreasing' | 'stable'
    if (Math.abs(productionChange) < 5) productionTrend = 'stable'
    else if (productionChange > 0) productionTrend = 'increasing'
    else productionTrend = 'decreasing'

    // Attendance trends
    const attendanceData = attendanceReport.dailyAttendance
    const firstWeekAttendance = attendanceData.slice(0, 7).reduce((sum, day) => sum + day.attendanceRate, 0) / 7
    const lastWeekAttendance = attendanceData.slice(-7).reduce((sum, day) => sum + day.attendanceRate, 0) / 7
    const attendanceChange = firstWeekAttendance > 0 ? ((lastWeekAttendance - firstWeekAttendance) / firstWeekAttendance) * 100 : 0

    let attendanceTrend: 'improving' | 'declining' | 'stable'
    if (Math.abs(attendanceChange) < 3) attendanceTrend = 'stable'
    else if (attendanceChange > 0) attendanceTrend = 'improving'
    else attendanceTrend = 'declining'

    // Generate recommendations
    const recommendations: string[] = []
    
    if (productionReport.summary.lossPercentage > 10) {
      recommendations.push("High egg loss rate detected. Review handling procedures and storage conditions.")
    }
    
    if (attendanceReport.summary.averageAttendanceRate < 85) {
      recommendations.push("Low attendance rate. Consider reviewing work conditions and incentive programs.")
    }
    
    if (topPerformingSheds.length > 0 && topPerformingSheds[0].efficiency < 70) {
      recommendations.push("Overall shed efficiency is below optimal. Review feeding schedules and environmental conditions.")
    }

    const lowPerformingWorkers = attendanceReport.workerBreakdown.filter(w => w.status === 'needs_improvement')
    if (lowPerformingWorkers.length > 0) {
      recommendations.push(`${lowPerformingWorkers.length} workers need attendance improvement. Consider individual coaching sessions.`)
    }

    return {
      metadata: {
        organizationName: organization?.name || 'Unknown Organization',
        reportType: 'Comprehensive Farm Report',
        dateRange: `${format(filters.startDate, 'MMM dd, yyyy')} - ${format(filters.endDate, 'MMM dd, yyyy')}`,
        generatedAt: new Date(),
        generatedBy
      },
      production: productionReport,
      attendance: attendanceReport,
      insights: {
        topPerformingSheds,
        productionTrends: {
          trend: productionTrend,
          changePercentage: Math.abs(productionChange),
          description: `Production is ${productionTrend} by ${Math.abs(productionChange).toFixed(1)}% compared to the beginning of the period.`
        },
        attendanceInsights: {
          trend: attendanceTrend,
          changePercentage: Math.abs(attendanceChange),
          description: `Attendance is ${attendanceTrend} by ${Math.abs(attendanceChange).toFixed(1)}% compared to the beginning of the period.`
        },
        recommendations
      }
    }
  }

  // Predefined report templates
  async generateDailyReport(date: Date = new Date()): Promise<ComprehensiveReport> {
    return this.generateComprehensiveReport({
      startDate: startOfDay(date),
      endDate: endOfDay(date)
    }, 'System - Daily Report')
  }

  async generateWeeklyReport(date: Date = new Date()): Promise<ComprehensiveReport> {
    return this.generateComprehensiveReport({
      startDate: startOfWeek(date),
      endDate: endOfWeek(date)
    }, 'System - Weekly Report')
  }

  async generateMonthlyReport(date: Date = new Date()): Promise<ComprehensiveReport> {
    return this.generateComprehensiveReport({
      startDate: startOfMonth(date),
      endDate: endOfMonth(date)
    }, 'System - Monthly Report')
  }
}