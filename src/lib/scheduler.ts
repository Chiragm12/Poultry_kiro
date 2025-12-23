import { prisma } from "./prisma"
import { ReportService } from "./reports"
import { EmailService } from "./email"
import { addDays, addWeeks, addMonths, startOfDay, endOfDay, subDays } from "date-fns"

export interface ScheduledReportConfig {
  organizationId: string
  reportType: 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  isActive: boolean
  farmId?: string
  shedId?: string
  managerId?: string
}

export class SchedulerService {
  // Create a new scheduled report
  static async createScheduledReport(config: ScheduledReportConfig): Promise<string> {
    const nextSend = this.calculateNextSendDate(config.reportType)
    
    const scheduledReport = await prisma.$executeRaw`
      INSERT INTO scheduled_reports (
        id, organization_id, report_type, recipients, is_active, 
        next_send, farm_id, shed_id, manager_id, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${config.organizationId}, ${config.reportType}, 
        ${JSON.stringify(config.recipients)}, ${config.isActive}, 
        ${nextSend}, ${config.farmId || null}, ${config.shedId || null}, 
        ${config.managerId || null}, NOW(), NOW()
      ) RETURNING id
    `
    
    return scheduledReport as string
  }

  // Update scheduled report
  static async updateScheduledReport(
    id: string, 
    organizationId: string, 
    updates: Partial<ScheduledReportConfig>
  ): Promise<void> {
    const updateData: any = { ...updates, updatedAt: new Date() }
    
    if (updates.reportType) {
      updateData.nextSend = this.calculateNextSendDate(updates.reportType)
    }
    
    await prisma.$executeRaw`
      UPDATE scheduled_reports 
      SET ${Object.keys(updateData).map(key => `${key} = $${key}`).join(', ')}
      WHERE id = ${id} AND organization_id = ${organizationId}
    `
  }

  // Delete scheduled report
  static async deleteScheduledReport(id: string, organizationId: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM scheduled_reports 
      WHERE id = ${id} AND organization_id = ${organizationId}
    `
  }

  // Get scheduled reports for organization
  static async getScheduledReports(organizationId: string): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT * FROM scheduled_reports 
      WHERE organization_id = ${organizationId}
      ORDER BY created_at DESC
    `
  }

  // Process due reports (called by cron job)
  static async processDueReports(): Promise<void> {
    const now = new Date()
    
    const dueReports = await prisma.$queryRaw`
      SELECT * FROM scheduled_reports 
      WHERE is_active = true AND next_send <= ${now}
    `

    for (const report of dueReports as any[]) {
      try {
        await this.sendScheduledReport(report)
        
        // Update next send date
        const nextSend = this.calculateNextSendDate(report.report_type)
        await prisma.$executeRaw`
          UPDATE scheduled_reports 
          SET last_sent = ${now}, next_send = ${nextSend}, updated_at = ${now}
          WHERE id = ${report.id}
        `
        
        console.log(`Scheduled report ${report.id} sent successfully`)
      } catch (error) {
        console.error(`Failed to send scheduled report ${report.id}:`, error)
        
        // Log the error but continue processing other reports
        await prisma.$executeRaw`
          UPDATE scheduled_reports 
          SET updated_at = ${now}
          WHERE id = ${report.id}
        `
      }
    }
  }

  // Send a scheduled report
  private static async sendScheduledReport(scheduledReport: any): Promise<void> {
    const reportService = new ReportService(scheduledReport.organization_id)
    
    let report
    const now = new Date()
    
    switch (scheduledReport.report_type) {
      case 'daily':
        report = await reportService.generateDailyReport(subDays(now, 1))
        break
      case 'weekly':
        report = await reportService.generateWeeklyReport(subDays(now, 7))
        break
      case 'monthly':
        report = await reportService.generateMonthlyReport(subDays(now, 30))
        break
      default:
        throw new Error(`Unknown report type: ${scheduledReport.report_type}`)
    }

    const recipients = JSON.parse(scheduledReport.recipients)
    await EmailService.sendReportEmail(recipients, report)
  }

  // Calculate next send date based on report type
  private static calculateNextSendDate(reportType: string): Date {
    const now = new Date()
    
    switch (reportType) {
      case 'daily':
        // Send daily reports at 8 AM next day
        const tomorrow = addDays(now, 1)
        tomorrow.setHours(8, 0, 0, 0)
        return tomorrow
        
      case 'weekly':
        // Send weekly reports on Monday at 8 AM
        const nextWeek = addWeeks(now, 1)
        const monday = nextWeek.getDate() - nextWeek.getDay() + 1
        nextWeek.setDate(monday)
        nextWeek.setHours(8, 0, 0, 0)
        return nextWeek
        
      case 'monthly':
        // Send monthly reports on 1st of next month at 8 AM
        const nextMonth = addMonths(now, 1)
        nextMonth.setDate(1)
        nextMonth.setHours(8, 0, 0, 0)
        return nextMonth
        
      default:
        throw new Error(`Unknown report type: ${reportType}`)
    }
  }

  // Send alert notifications
  static async sendAlertNotifications(organizationId: string): Promise<void> {
    // Get organization users who should receive alerts
    const users = await prisma.user.findMany({
      where: {
        organizationId,
        role: { in: ['OWNER', 'MANAGER'] },
        isActive: true
      },
      select: { email: true, name: true }
    })

    if (users.length === 0) return

    // Get recent alerts (you would implement alert detection logic)
    const alerts = await this.detectAlerts(organizationId)
    
    if (alerts.length === 0) return

    const recipients = users.map(user => user.email)
    const alertMessages = alerts.map(alert => `• ${alert.message}`).join('\n')
    
    const subject = `Farm Alert: ${alerts.length} issue(s) require attention`
    const message = `The following alerts have been detected in your farm operations:\n\n${alertMessages}\n\nPlease review your dashboard for more details and take appropriate action.`

    await EmailService.sendNotificationEmail(recipients, subject, message, 'warning')
  }

  // Detect alerts (simplified implementation)
  private static async detectAlerts(organizationId: string): Promise<Array<{
    type: string
    message: string
    severity: string
  }>> {
    const alerts = []
    const yesterday = subDays(new Date(), 1)

    // Check for low production
    const lowProductionSheds = await prisma.$queryRaw`
      SELECT s.name as shed_name, f.name as farm_name, 
             COALESCE(p.sellable_eggs, 0) as production,
             s.capacity
      FROM sheds s
      JOIN farms f ON s.farm_id = f.id
      LEFT JOIN productions p ON s.id = p.shed_id AND p.date = ${yesterday}
      WHERE f.organization_id = ${organizationId}
        AND s.is_active = true
        AND (p.sellable_eggs IS NULL OR p.sellable_eggs < s.capacity * 0.5)
    `

    for (const shed of lowProductionSheds as any[]) {
      alerts.push({
        type: 'low_production',
        message: `${shed.shed_name} (${shed.farm_name}) production is below 50% capacity`,
        severity: 'medium'
      })
    }

    // Check for poor attendance
    const poorAttendance = await prisma.$queryRaw`
      SELECT COUNT(*) as absent_count,
             (SELECT COUNT(*) FROM users WHERE organization_id = ${organizationId} AND role = 'WORKER' AND is_active = true) as total_workers
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE u.organization_id = ${organizationId}
        AND a.date = ${yesterday}
        AND a.status = 'ABSENT'
    `

    const attendanceData = poorAttendance as any[]
    if (attendanceData.length > 0 && attendanceData[0].total_workers > 0) {
      const absentRate = (attendanceData[0].absent_count / attendanceData[0].total_workers) * 100
      if (absentRate > 20) {
        alerts.push({
          type: 'poor_attendance',
          message: `High absence rate detected: ${absentRate.toFixed(1)}% of workers were absent`,
          severity: 'high'
        })
      }
    }

    return alerts
  }

  // Setup cron job (this would be called from a separate cron service)
  static setupCronJobs(): void {
    // This is a simplified example - in production, you'd use a proper cron service
    // like node-cron or integrate with a service like Vercel Cron
    
    console.log('Setting up scheduled report processing...')
    
    // Process reports every hour
    setInterval(async () => {
      try {
        await this.processDueReports()
      } catch (error) {
        console.error('Error processing scheduled reports:', error)
      }
    }, 60 * 60 * 1000) // 1 hour

    // Send alert notifications every 4 hours
    setInterval(async () => {
      try {
        // Get all organizations and process alerts
        const organizations = await prisma.organization.findMany({
          select: { id: true }
        })
        
        for (const org of organizations) {
          await this.sendAlertNotifications(org.id)
        }
      } catch (error) {
        console.error('Error sending alert notifications:', error)
      }
    }, 4 * 60 * 60 * 1000) // 4 hours
  }
}

// Database schema for scheduled reports (add this to your Prisma schema)
/*
model ScheduledReport {
  id             String   @id @default(cuid())
  organizationId String
  reportType     String   // 'daily', 'weekly', 'monthly'
  recipients     Json     // Array of email addresses
  isActive       Boolean  @default(true)
  lastSent       DateTime?
  nextSend       DateTime
  farmId         String?
  shedId         String?
  managerId      String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@map("scheduled_reports")
}
*/