import { prisma } from "./prisma"
import { startOfDay, endOfDay, subDays, format, startOfWeek, endOfWeek, differenceInWeeks, differenceInDays } from "date-fns"

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
  week?: number
  dayOfWeek?: number
}

export interface WeeklyProductionSummary {
  week: number
  startDate: string
  endDate: string
  totalEggs: number
  sellableEggs: number
  wasteEggs: number
  averageDaily: number
  efficiency: number
  daysRecorded: number
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
        farm: {
          organizationId: this.organizationId
        },
        date: {
          gte: today,
          lte: endOfDay(new Date())
        }
      },
      _sum: { 
        tableEggs: true,
        hatchingEggs: true,
        totalEggs: true
      }
    })

    // Get yesterday's production for trend
    const yesterdayProduction = await prisma.production.aggregate({
      where: {
        farm: {
          organizationId: this.organizationId
        },
        date: {
          gte: yesterday,
          lt: today
        }
      },
      _sum: { 
        tableEggs: true,
        hatchingEggs: true,
        totalEggs: true
      }
    })

    // Get total production for the period
    const totalProduction = await prisma.production.aggregate({
      where: {
        farm: {
          organizationId: this.organizationId
        },
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { 
        tableEggs: true,
        hatchingEggs: true,
        totalEggs: true,
        crackedEggs: true,
        jumboEggs: true,
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
    const sellableEggs = (todayProduction._sum.tableEggs || 0) + (todayProduction._sum.hatchingEggs || 0)
    const yesterdaySellableEggs = (yesterdayProduction._sum.tableEggs || 0) + (yesterdayProduction._sum.hatchingEggs || 0)
    const totalSellableEggs = (totalProduction._sum.tableEggs || 0) + (totalProduction._sum.hatchingEggs || 0)
    
    const productionTrend = yesterdaySellableEggs 
      ? (sellableEggs - yesterdaySellableEggs) / yesterdaySellableEggs * 100
      : 0

    const attendanceTrend = yesterdayAttendanceRate > 0 
      ? (attendanceRate - yesterdayAttendanceRate) / yesterdayAttendanceRate * 100
      : 0

    return {
      todayProduction: sellableEggs,
      totalProduction: totalSellableEggs,
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
        farm: {
          organizationId: this.organizationId
        },
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        totalEggs: true,
        tableEggs: true,
        hatchingEggs: true,
        crackedEggs: true,
        jumboEggs: true,
        leakerEggs: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Get the first production date to calculate weeks
    const firstProduction = await prisma.production.findFirst({
      where: {
        farm: {
          organizationId: this.organizationId
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    const cycleStartDate = firstProduction?.date || startDate

    return productions.map(p => {
      const sellableEggs = (p._sum.tableEggs || 0) + (p._sum.hatchingEggs || 0)
      const wasteEggs = (p._sum.crackedEggs || 0) + (p._sum.leakerEggs || 0)
      
      // Calculate week number and day of week
      const weeksSinceStart = differenceInWeeks(p.date, cycleStartDate) + 1
      const dayOfWeek = ((p.date.getDay() + 6) % 7) + 1 // Convert to 1-7 (Mon-Sun)
      
      return {
        date: format(p.date, 'yyyy-MM-dd'),
        totalEggs: p._sum.totalEggs || 0,
        sellableEggs,
        normalEggs: p._sum.hatchingEggs || 0, // Map hatchingEggs to normalEggs for compatibility
        commEggs: p._sum.tableEggs || 0, // Map tableEggs to commEggs for compatibility
        waterEggs: 0, // Not used in new schema
        jellyEggs: 0, // Not used in new schema
        creakEggs: p._sum.crackedEggs || 0,
        leakerEggs: p._sum.leakerEggs || 0,
        wasteEggs,
        brokenEggs: 0, // Not used in new schema
        damagedEggs: 0, // Not used in new schema
        week: weeksSinceStart,
        dayOfWeek
      }
    })
  }

  async getWeeklyProductionSummary(weeks: number = 12): Promise<WeeklyProductionSummary[]> {
    const endDate = endOfDay(new Date())
    const startDate = startOfDay(subDays(endDate, weeks * 7))

    // Get the active production cycle
    const activeCycle = await prisma.productionCycle.findFirst({
      where: {
        organizationId: this.organizationId,
        isActive: true
      }
    })

    let cycleStartDate: Date
    let startWeekNumber: number

    if (activeCycle) {
      cycleStartDate = activeCycle.startDate
      startWeekNumber = activeCycle.startWeek
    } else {
      // Fallback: use first production date
      const firstProduction = await prisma.production.findFirst({
        where: {
          farm: {
            organizationId: this.organizationId
          }
        },
        orderBy: {
          date: 'asc'
        }
      })

      cycleStartDate = firstProduction?.date || new Date()
      startWeekNumber = 1
    }

    const productions = await prisma.production.findMany({
      where: {
        farm: {
          organizationId: this.organizationId
        },
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Group productions by week
    const weeklyData = new Map<number, {
      productions: any[]
      startDate: Date
      endDate: Date
    }>()

    productions.forEach(production => {
      const weeksSinceStart = differenceInWeeks(production.date, cycleStartDate)
      const weekNumber = startWeekNumber + weeksSinceStart
      const weekStart = startOfWeek(production.date, { weekStartsOn: 1 }) // Monday start
      const weekEnd = endOfWeek(production.date, { weekStartsOn: 1 })

      if (!weeklyData.has(weekNumber)) {
        weeklyData.set(weekNumber, {
          productions: [],
          startDate: weekStart,
          endDate: weekEnd
        })
      }

      weeklyData.get(weekNumber)!.productions.push(production)
    })

    // Convert to summary format
    return Array.from(weeklyData.entries()).map(([weekNumber, data]) => {
      const totalEggs = data.productions.reduce((sum, p) => sum + p.totalEggs, 0)
      const sellableEggs = data.productions.reduce((sum, p) => sum + p.tableEggs + p.hatchingEggs, 0)
      const wasteEggs = data.productions.reduce((sum, p) => sum + p.crackedEggs + p.leakerEggs, 0)
      const daysRecorded = data.productions.length
      const averageDaily = daysRecorded > 0 ? sellableEggs / daysRecorded : 0
      const efficiency = totalEggs > 0 ? (sellableEggs / totalEggs) * 100 : 0

      return {
        week: weekNumber,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        endDate: format(data.endDate, 'yyyy-MM-dd'),
        totalEggs,
        sellableEggs,
        wasteEggs,
        averageDaily: Math.round(averageDaily * 100) / 100,
        efficiency: Math.round(efficiency * 100) / 100,
        daysRecorded
      }
    }).sort((a, b) => b.week - a.week) // Most recent weeks first
  }

  async getCurrentWeekStatus(): Promise<{
    currentWeek: number
    dayOfWeek: number
    dayName: string
    totalDays: number
    weeksRemaining: number
    cycleName?: string
    cycleStartDate?: string
  }> {
    // Get the active production cycle
    const activeCycle = await prisma.productionCycle.findFirst({
      where: {
        organizationId: this.organizationId,
        isActive: true
      },
      include: {
        farm: {
          select: {
            name: true
          }
        }
      }
    })

    const now = new Date()
    
    if (activeCycle) {
      // Use production cycle data
      const cycleStartDate = activeCycle.startDate
      const weeksSinceStart = differenceInWeeks(now, cycleStartDate)
      const currentWeek = activeCycle.startWeek + weeksSinceStart
      const dayOfWeek = ((now.getDay() + 6) % 7) + 1 // Convert to 1-7 (Mon-Sun)
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const dayName = dayNames[dayOfWeek - 1]
      const totalDays = differenceInDays(now, cycleStartDate) + 1
      const weeksRemaining = Math.max(0, activeCycle.expectedEndWeek - currentWeek)

      return {
        currentWeek,
        dayOfWeek,
        dayName,
        totalDays,
        weeksRemaining,
        cycleName: activeCycle.name,
        cycleStartDate: format(cycleStartDate, 'yyyy-MM-dd')
      }
    } else {
      // Fallback: use first production date if no active cycle
      const firstProduction = await prisma.production.findFirst({
        where: {
          farm: {
            organizationId: this.organizationId
          }
        },
        orderBy: {
          date: 'asc'
        }
      })

      const cycleStartDate = firstProduction?.date || now
      const currentWeek = differenceInWeeks(now, cycleStartDate) + 1
      const dayOfWeek = ((now.getDay() + 6) % 7) + 1
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const dayName = dayNames[dayOfWeek - 1]
      const totalDays = differenceInDays(now, cycleStartDate) + 1
      const weeksRemaining = Math.max(0, 72 - currentWeek) // Default 72 weeks

      return {
        currentWeek,
        dayOfWeek,
        dayName,
        totalDays,
        weeksRemaining
      }
    }
  }

  async getShedPerformance(days: number = 30): Promise<ShedPerformance[]> {
    const startDate = startOfDay(subDays(new Date(), days))
    const endDate = endOfDay(new Date())

    // Since productions are linked to farms, not sheds, we'll get farm performance
    const farmStats = await prisma.farm.findMany({
      where: {
        organizationId: this.organizationId,
        isActive: true
      },
      include: {
        productions: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            tableEggs: true,
            hatchingEggs: true,
            totalEggs: true
          }
        },
        sheds: {
          where: { isActive: true },
          select: {
            capacity: true
          }
        }
      }
    })

    return farmStats.map(farm => {
      const totalProduction = farm.productions.reduce((sum, p) => sum + (p.tableEggs + p.hatchingEggs), 0)
      const totalEggs = farm.productions.reduce((sum, p) => sum + p.totalEggs, 0)
      const averageDaily = farm.productions.length > 0 ? totalProduction / farm.productions.length : 0
      const totalCapacity = farm.sheds.reduce((sum, shed) => sum + shed.capacity, 0)
      const efficiency = totalCapacity > 0 ? (averageDaily / totalCapacity) * 100 : 0

      return {
        shedId: farm.id, // Using farm ID as shed ID for compatibility
        shedName: farm.name,
        farmName: farm.name,
        totalProduction,
        averageDaily: Math.round(averageDaily * 100) / 100,
        efficiency: Math.round(efficiency * 100) / 100,
        capacity: totalCapacity
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

    // Get farms with recent production data
    const farms = await prisma.farm.findMany({
      where: {
        organizationId: this.organizationId,
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
        },
        sheds: {
          where: { isActive: true },
          select: { capacity: true }
        }
      }
    })

    for (const farm of farms) {
      if (farm.productions.length === 0) continue

      const latestProduction = farm.productions[0]
      const avgProduction = farm.productions.reduce((sum, p) => sum + (p.tableEggs + p.hatchingEggs), 0) / farm.productions.length
      const totalCapacity = farm.sheds.reduce((sum, shed) => sum + shed.capacity, 0)
      const expectedProduction = totalCapacity * 0.8 // 80% expected rate

      // Low production alert
      const currentProduction = latestProduction.tableEggs + latestProduction.hatchingEggs
      if (currentProduction < expectedProduction * 0.6) {
        alerts.push({
          type: 'low_production' as const,
          message: `${farm.name} production is significantly below expected (${currentProduction} vs ${Math.round(expectedProduction)})`,
          shedId: farm.id,
          shedName: farm.name,
          severity: 'high' as const
        })
      }

      // High waste rate alert (using new egg categories)
      const wasteEggs = latestProduction.crackedEggs + latestProduction.leakerEggs
      const wasteRate = latestProduction.totalEggs > 0 ? wasteEggs / latestProduction.totalEggs : 0
      
      if (wasteRate > 0.1) { // More than 10% waste
        alerts.push({
          type: 'high_damage' as const,
          message: `${farm.name} has high egg waste rate (${Math.round(wasteRate * 100)}%) - check handling and storage`,
          shedId: farm.id,
          shedName: farm.name,
          severity: wasteRate > 0.15 ? 'high' as const : 'medium' as const
        })
      }

      // Capacity utilization alert
      const utilizationRate = totalCapacity > 0 ? avgProduction / totalCapacity : 0
      if (utilizationRate > 0.95) {
        alerts.push({
          type: 'capacity_issue' as const,
          message: `${farm.name} is operating at ${Math.round(utilizationRate * 100)}% capacity`,
          shedId: farm.id,
          shedName: farm.name,
          severity: 'medium' as const
        })
      }
    }

    return alerts
  }
}