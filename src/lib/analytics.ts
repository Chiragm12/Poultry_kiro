import { prisma } from "./prisma"
import { startOfDay, endOfDay, subDays, format } from "date-fns"

export interface DashboardStats {
  todayProduction: number
  totalProduction: number
  attendanceRate: number
  activeFarms: number
  activeSheds: number
  totalWorkers: number
  productionTrend: number
  attendanceTrend: number
}

export interface ProductionTrend {
  date: string
  totalEggs: number
  sellableEggs: number
  normalEggs: number
  commEggs: number
  waterEggs: number
  jellyEggs: number
  creakEggs: number
  leakerEggs: number
  wasteEggs: number // waterEggs + jellyEggs + creakEggs + leakerEggs
  brokenEggs: number // Keep for backward compatibility
  damagedEggs: number // Keep for backward compatibility
}

export interface ShedPerformance {
  shedId: string
  shedName: string
  farmName: string
  totalProduction: number
  averageDaily: number
  efficiency: number
  capacity: number
}

export interface AttendanceSummary {
  userId: string
  userName: string
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  attendanceRate: number
}

export class AnalyticsService {
  constructor(private organizationId: string) {}

  async getDashboardStats(days: number = 30): Promise<DashboardStats> {
    const startDate = startOfDay(subDays(new Date(), days))
    const endDate = endOfDay(new Date())
    const today = startOfDay(new Date())
    const yesterday = startOfDay(subDays(new Date(), 1))

    // Get today's production
    const todayProduction = await prisma.production.aggregate({
      where: {
        shed: {
          farm: { organizationId: this.organizationId }
        },
        date: {
          gte: today,
          lte: endOfDay(new Date())
        }
      },
      _sum: { 
        sellableEggs: true,
        totalEggs: true,
        normalEggs: true,
        commEggs: true
      }
    })

    // Get yesterday's production for trend
    const yesterdayProduction = await prisma.production.aggregate({
      where: {
        shed: {
          farm: { organizationId: this.organizationId }
        },
        date: {
          gte: yesterday,
          lt: today
        }
      },
      _sum: { 
        sellableEggs: true,
        totalEggs: true
      }
    })

    // Get total production for the period
    const totalProduction = await prisma.production.aggregate({
      where: {
        shed: {
          farm: { organizationId: this.organizationId }
        },
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { 
        sellableEggs: true,
        totalEggs: true,
        normalEggs: true,
        commEggs: true,
        waterEggs: true,
        jellyEggs: true,
        creakEggs: true,
        leakerEggs: true
      }
    })

    // Get farm and shed counts
    const [activeFarms, activeSheds] = await Promise.all([
      prisma.farm.count({
        where: {
          organizationId: this.organizationId,
          isActive: true
        }
      }),
      prisma.shed.count({
        where: {
          farm: {
            organizationId: this.organizationId,
            isActive: true
          },
          isActive: true
        }
      })
    ])

    // Get worker count and attendance
    const totalWorkers = await prisma.user.count({
      where: {
        organizationId: this.organizationId,
        role: "WORKER",
        isActive: true
      }
    })

    // Get today's attendance
    const todayAttendance = await prisma.attendance.count({
      where: {
        user: { organizationId: this.organizationId },
        date: today,
        status: { in: ["PRESENT", "LATE"] }
      }
    })

    // Get yesterday's attendance for trend
    const yesterdayAttendance = await prisma.attendance.count({
      where: {
        user: { organizationId: this.organizationId },
        date: yesterday,
        status: { in: ["PRESENT", "LATE"] }
      }
    })

    const attendanceRate = totalWorkers > 0 ? (todayAttendance / totalWorkers) * 100 : 0
    const yesterdayAttendanceRate = totalWorkers > 0 ? (yesterdayAttendance / totalWorkers) * 100 : 0

    // Calculate trends
    const productionTrend = yesterdayProduction._sum.sellableEggs 
      ? ((todayProduction._sum.sellableEggs || 0) - yesterdayProduction._sum.sellableEggs) / yesterdayProduction._sum.sellableEggs * 100
      : 0

    const attendanceTrend = yesterdayAttendanceRate > 0 
      ? (attendanceRate - yesterdayAttendanceRate) / yesterdayAttendanceRate * 100
      : 0

    return {
      todayProduction: todayProduction._sum.sellableEggs || 0,
      totalProduction: totalProduction._sum.sellableEggs || 0,
      attendanceRate: Math.round(attendanceRate),
      activeFarms,
      activeSheds,
      totalWorkers,
      productionTrend: Math.round(productionTrend * 100) / 100,
      attendanceTrend: Math.round(attendanceTrend * 100) / 100
    }
  }

  async getProductionTrend(days: number = 30): Promise<ProductionTrend[]> {
    const startDate = startOfDay(subDays(new Date(), days))
    const endDate = endOfDay(new Date())

    const productions = await prisma.production.groupBy({
      by: ['date'],
      where: {
        shed: {
          farm: { organizationId: this.organizationId }
        },
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        totalEggs: true,
        sellableEggs: true,
        normalEggs: true,
        commEggs: true,
        waterEggs: true,
        jellyEggs: true,
        creakEggs: true,
        leakerEggs: true,
        brokenEggs: true,
        damagedEggs: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    return productions.map(p => {
      const wasteEggs = (p._sum.waterEggs || 0) + (p._sum.jellyEggs || 0) + 
                       (p._sum.creakEggs || 0) + (p._sum.leakerEggs || 0)
      
      return {
        date: format(p.date, 'yyyy-MM-dd'),
        totalEggs: p._sum.totalEggs || 0,
        sellableEggs: p._sum.sellableEggs || 0,
        normalEggs: p._sum.normalEggs || 0,
        commEggs: p._sum.commEggs || 0,
        waterEggs: p._sum.waterEggs || 0,
        jellyEggs: p._sum.jellyEggs || 0,
        creakEggs: p._sum.creakEggs || 0,
        leakerEggs: p._sum.leakerEggs || 0,
        wasteEggs,
        brokenEggs: p._sum.brokenEggs || 0,
        damagedEggs: p._sum.damagedEggs || 0
      }
    })
  }

  async getShedPerformance(days: number = 30): Promise<ShedPerformance[]> {
    const startDate = startOfDay(subDays(new Date(), days))
    const endDate = endOfDay(new Date())

    const shedStats = await prisma.shed.findMany({
      where: {
        farm: {
          organizationId: this.organizationId,
          isActive: true
        },
        isActive: true
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
            sellableEggs: true,
            totalEggs: true,
            normalEggs: true,
            commEggs: true
          }
        }
      }
    })

    return shedStats.map(shed => {
      const totalProduction = shed.productions.reduce((sum, p) => sum + p.sellableEggs, 0)
      const totalEggs = shed.productions.reduce((sum, p) => sum + p.totalEggs, 0)
      const averageDaily = shed.productions.length > 0 ? totalProduction / shed.productions.length : 0
      const efficiency = shed.capacity > 0 ? (averageDaily / shed.capacity) * 100 : 0

      return {
        shedId: shed.id,
        shedName: shed.name,
        farmName: shed.farm.name,
        totalProduction,
        averageDaily: Math.round(averageDaily * 100) / 100,
        efficiency: Math.round(efficiency * 100) / 100,
        capacity: shed.capacity
      }
    }).sort((a, b) => b.totalProduction - a.totalProduction)
  }

  async getAttendanceSummary(days: number = 30): Promise<AttendanceSummary[]> {
    const startDate = startOfDay(subDays(new Date(), days))
    const endDate = endOfDay(new Date())

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

    return workers.map(worker => {
      const totalDays = worker.attendanceRecords.length
      const presentDays = worker.attendanceRecords.filter(a => a.status === "PRESENT").length
      const absentDays = worker.attendanceRecords.filter(a => a.status === "ABSENT").length
      const lateDays = worker.attendanceRecords.filter(a => a.status === "LATE").length
      const attendanceRate = totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 0

      return {
        userId: worker.id,
        userName: worker.name || worker.email,
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      }
    }).sort((a, b) => b.attendanceRate - a.attendanceRate)
  }

  async getProductionAlerts(): Promise<Array<{
    type: 'low_production' | 'high_damage' | 'capacity_issue'
    message: string
    shedId: string
    shedName: string
    severity: 'low' | 'medium' | 'high'
  }>> {
    const alerts = []
    const yesterday = startOfDay(subDays(new Date(), 1))
    const weekAgo = startOfDay(subDays(new Date(), 7))

    // Get sheds with recent production data
    const sheds = await prisma.shed.findMany({
      where: {
        farm: {
          organizationId: this.organizationId,
          isActive: true
        },
        isActive: true
      },
      include: {
        productions: {
          where: {
            date: {
              gte: weekAgo,
              lte: yesterday
            }
          },
          orderBy: { date: 'desc' },
          take: 7
        }
      }
    })

    for (const shed of sheds) {
      if (shed.productions.length === 0) continue

      const latestProduction = shed.productions[0]
      const avgProduction = shed.productions.reduce((sum, p) => sum + p.sellableEggs, 0) / shed.productions.length
      const expectedProduction = shed.capacity * 0.8 // 80% expected rate

      // Low production alert
      if (latestProduction.sellableEggs < expectedProduction * 0.6) {
        alerts.push({
          type: 'low_production' as const,
          message: `${shed.name} production is significantly below expected (${latestProduction.sellableEggs} vs ${Math.round(expectedProduction)})`,
          shedId: shed.id,
          shedName: shed.name,
          severity: 'high' as const
        })
      }

      // High waste rate alert (using new egg categories)
      const wasteEggs = (latestProduction.waterEggs || 0) + (latestProduction.jellyEggs || 0) + 
                       (latestProduction.creakEggs || 0) + (latestProduction.leakerEggs || 0)
      const wasteRate = latestProduction.totalEggs > 0 ? wasteEggs / latestProduction.totalEggs : 0
      
      if (wasteRate > 0.1) { // More than 10% waste
        alerts.push({
          type: 'high_damage' as const,
          message: `${shed.name} has high egg waste rate (${Math.round(wasteRate * 100)}%) - check handling and storage`,
          shedId: shed.id,
          shedName: shed.name,
          severity: wasteRate > 0.15 ? 'high' as const : 'medium' as const
        })
      }

      // Capacity utilization alert
      const utilizationRate = avgProduction / shed.capacity
      if (utilizationRate > 0.95) {
        alerts.push({
          type: 'capacity_issue' as const,
          message: `${shed.name} is operating at ${Math.round(utilizationRate * 100)}% capacity`,
          shedId: shed.id,
          shedName: shed.name,
          severity: 'medium' as const
        })
      }
    }

    return alerts
  }
}