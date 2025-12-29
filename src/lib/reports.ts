import { prisma } from "./prisma"
import { startOfDay, endOfDay, format, differenceInDays } from "date-fns"

interface ReportRequest {
  reportType: "comprehensive" | "production" | "attendance" | "daily" | "weekly" | "monthly"
  startDate: string
  endDate: string
  farmId?: string
  shedId?: string
  managerId?: string
}

interface ProductionSummary {
  totalEggs: number
  sellableEggs: number
  brokenEggs: number
  damagedEggs: number
  lossPercentage: number
  averageDaily: number
}

interface AttendanceSummary {
  totalWorkers: number
  averageAttendanceRate: number
  totalPresentDays: number
  totalLateDays: number
  totalAbsentDays: number
}

interface ShedBreakdown {
  shedId: string
  shedName: string
  farmName: string
  totalEggs: number
  sellableEggs: number
  brokenEggs: number
  damagedEggs: number
  efficiency: number
}

interface WorkerBreakdown {
  userId: string
  userName: string
  totalDays: number
  presentDays: number
  lateDays: number
  absentDays: number
  attendanceRate: number
  status: 'excellent' | 'good' | 'needs_improvement'
}

export class ReportsService {
  constructor(private organizationId: string) {}

  async generateReport(request: ReportRequest) {
    const startDate = startOfDay(new Date(request.startDate))
    const endDate = endOfDay(new Date(request.endDate))
    const totalDays = differenceInDays(endDate, startDate) + 1

    // Get organization info
    const organization = await prisma.organization.findUnique({
      where: { id: this.organizationId },
      select: { name: true }
    })

    const metadata = {
      reportType: this.getReportTypeLabel(request.reportType),
      organizationName: organization?.name || "Unknown Organization",
      dateRange: `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`,
      generatedAt: new Date().toISOString(),
      totalDays
    }

    let reportData: any = { metadata }

    // Generate different sections based on report type
    if (request.reportType === "comprehensive" || request.reportType === "production") {
      reportData.production = await this.getProductionData(startDate, endDate, request)
    }

    if (request.reportType === "comprehensive" || request.reportType === "attendance") {
      reportData.attendance = await this.getAttendanceData(startDate, endDate, request)
    }

    // Add insights for comprehensive reports
    if (request.reportType === "comprehensive") {
      reportData.insights = await this.generateInsights(reportData, totalDays)
    }

    return reportData
  }

  private async getProductionData(startDate: Date, endDate: Date, request: ReportRequest) {
    // Build where clause for filtering
    const whereClause: any = {
      shed: {
        farm: { 
          organizationId: this.organizationId,
          isActive: true
        },
        isActive: true
      },
      date: {
        gte: startDate,
        lte: endDate
      }
    }

    if (request.farmId) {
      whereClause.shed.farm.id = request.farmId
    }

    if (request.shedId) {
      whereClause.shed.id = request.shedId
    }

    // Get production summary
    const productionSummary = await prisma.production.aggregate({
      where: whereClause,
      _sum: {
        totalEggs: true,
        sellableEggs: true,
        brokenEggs: true,
        damagedEggs: true
      }
    })

    const totalEggs = productionSummary._sum.totalEggs || 0
    const sellableEggs = productionSummary._sum.sellableEggs || 0
    const brokenEggs = productionSummary._sum.brokenEggs || 0
    const damagedEggs = productionSummary._sum.damagedEggs || 0
    const lossEggs = brokenEggs + damagedEggs
    const lossPercentage = totalEggs > 0 ? (lossEggs / totalEggs) * 100 : 0
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    const averageDaily = sellableEggs / totalDays

    const summary: ProductionSummary = {
      totalEggs,
      sellableEggs,
      brokenEggs,
      damagedEggs,
      lossPercentage,
      averageDaily
    }

    // Get shed breakdown
    const shedBreakdown = await prisma.shed.findMany({
      where: {
        farm: {
          organizationId: this.organizationId,
          isActive: true,
          ...(request.farmId && { id: request.farmId })
        },
        isActive: true,
        ...(request.shedId && { id: request.shedId })
      },
      include: {
        farm: {
          select: { name: true }
        },
        productions: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            totalEggs: true,
            sellableEggs: true,
            brokenEggs: true,
            damagedEggs: true
          }
        }
      }
    })

    const shedBreakdownData: ShedBreakdown[] = shedBreakdown.map(shed => {
      const shedTotalEggs = shed.productions.reduce((sum, p) => sum + p.totalEggs, 0)
      const shedSellableEggs = shed.productions.reduce((sum, p) => sum + p.sellableEggs, 0)
      const shedBrokenEggs = shed.productions.reduce((sum, p) => sum + p.brokenEggs, 0)
      const shedDamagedEggs = shed.productions.reduce((sum, p) => sum + p.damagedEggs, 0)
      const efficiency = shed.capacity > 0 ? (shedSellableEggs / totalDays / shed.capacity) * 100 : 0

      return {
        shedId: shed.id,
        shedName: shed.name,
        farmName: shed.farm.name,
        totalEggs: shedTotalEggs,
        sellableEggs: shedSellableEggs,
        brokenEggs: shedBrokenEggs,
        damagedEggs: shedDamagedEggs,
        efficiency: Math.min(efficiency, 100) // Cap at 100%
      }
    })

    return {
      summary,
      shedBreakdown: shedBreakdownData
    }
  }

  private async getAttendanceData(startDate: Date, endDate: Date, request: ReportRequest) {
    // Build where clause for filtering
    const whereClause: any = {
      user: {
        organizationId: this.organizationId,
        role: "WORKER",
        isActive: true
      },
      date: {
        gte: startDate,
        lte: endDate
      }
    }

    if (request.managerId) {
      // If filtering by manager, we'd need to add manager relationship to workers
      // For now, we'll skip this filter
    }

    // Get all workers
    const workers = await prisma.user.findMany({
      where: {
        organizationId: this.organizationId,
        role: "WORKER",
        isActive: true
      },
      include: {
        attendanceRecords: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    })

    let totalPresentDays = 0
    let totalLateDays = 0
    let totalAbsentDays = 0
    let totalAttendanceRecords = 0

    const workerBreakdown: WorkerBreakdown[] = workers.map(worker => {
      const totalDays = worker.attendanceRecords.length
      const presentDays = worker.attendanceRecords.filter(a => a.status === "PRESENT").length
      const lateDays = worker.attendanceRecords.filter(a => a.status === "LATE").length
      const absentDays = worker.attendanceRecords.filter(a => a.status === "ABSENT").length
      const attendanceRate = totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 0

      // Update totals
      totalPresentDays += presentDays
      totalLateDays += lateDays
      totalAbsentDays += absentDays
      totalAttendanceRecords += totalDays

      // Determine status
      let status: 'excellent' | 'good' | 'needs_improvement'
      if (attendanceRate >= 95) {
        status = 'excellent'
      } else if (attendanceRate >= 85) {
        status = 'good'
      } else {
        status = 'needs_improvement'
      }

      return {
        userId: worker.id,
        userName: worker.name || worker.email,
        totalDays,
        presentDays,
        lateDays,
        absentDays,
        attendanceRate,
        status
      }
    })

    const averageAttendanceRate = totalAttendanceRecords > 0 
      ? ((totalPresentDays + totalLateDays) / totalAttendanceRecords) * 100 
      : 0

    const summary: AttendanceSummary = {
      totalWorkers: workers.length,
      averageAttendanceRate,
      totalPresentDays,
      totalLateDays,
      totalAbsentDays
    }

    return {
      summary,
      workerBreakdown
    }
  }

  private async generateInsights(reportData: any, totalDays: number) {
    const insights: any = {}

    // Production insights
    if (reportData.production) {
      const { summary, shedBreakdown } = reportData.production
      
      insights.productionTrends = {
        description: `Average daily production of ${Math.round(summary.averageDaily)} eggs with ${summary.lossPercentage.toFixed(1)}% loss rate over ${totalDays} days.`
      }

      // Find best and worst performing sheds
      if (shedBreakdown && shedBreakdown.length > 0) {
        const sortedSheds = shedBreakdown.sort((a: any, b: any) => b.efficiency - a.efficiency)
        const bestShed = sortedSheds[0]
        const worstShed = sortedSheds[sortedSheds.length - 1]
        
        insights.shedPerformance = {
          bestShed: bestShed.shedName,
          worstShed: worstShed.shedName,
          description: `${bestShed.shedName} is the top performer with ${bestShed.efficiency.toFixed(1)}% efficiency.`
        }
      }
    }

    // Attendance insights
    if (reportData.attendance) {
      const { summary, workerBreakdown } = reportData.attendance
      
      insights.attendanceInsights = {
        description: `Overall attendance rate of ${summary.averageAttendanceRate.toFixed(1)}% across ${summary.totalWorkers} workers.`
      }
    }

    // Generate recommendations
    const recommendations: string[] = []

    if (reportData.production?.summary.lossPercentage > 10) {
      recommendations.push("High egg loss rate detected. Consider reviewing handling procedures and storage conditions.")
    }

    if (reportData.attendance?.summary.averageAttendanceRate < 85) {
      recommendations.push("Low attendance rate. Consider implementing attendance incentives or reviewing work conditions.")
    }

    if (reportData.production?.shedBreakdown) {
      const lowPerformingSheds = reportData.production.shedBreakdown.filter((shed: any) => shed.efficiency < 60)
      if (lowPerformingSheds.length > 0) {
        recommendations.push(`${lowPerformingSheds.length} shed(s) showing low efficiency. Review feeding schedules and environmental conditions.`)
      }
    }

    if (recommendations.length === 0) {
      recommendations.push("Operations are performing well. Continue current practices and monitor trends.")
    }

    insights.recommendations = recommendations

    return insights
  }

  private getReportTypeLabel(reportType: string): string {
    const labels: Record<string, string> = {
      comprehensive: "Comprehensive Report",
      production: "Production Report",
      attendance: "Attendance Report",
      daily: "Daily Summary",
      weekly: "Weekly Summary",
      monthly: "Monthly Summary"
    }
    return labels[reportType] || "Report"
  }
}