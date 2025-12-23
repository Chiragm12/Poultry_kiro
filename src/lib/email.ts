import { Resend } from 'resend'
import { format } from 'date-fns'
import type { ComprehensiveReport } from './reports'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface ScheduledReport {
  id: string
  organizationId: string
  reportType: 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  isActive: boolean
  lastSent?: Date
  nextSend: Date
  createdAt: Date
  updatedAt: Date
}

export class EmailService {
  static async sendReportEmail(
    recipients: string[],
    report: ComprehensiveReport,
    attachments?: Array<{
      filename: string
      content: Buffer
      contentType: string
    }>
  ): Promise<void> {
    const template = this.generateReportEmailTemplate(report)
    
    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'reports@poultryfarmsaas.com',
        to: recipients,
        subject: template.subject,
        html: template.html,
        text: template.text,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      })
    } catch (error) {
      console.error('Failed to send report email:', error)
      throw new Error('Failed to send report email')
    }
  }

  static generateReportEmailTemplate(report: ComprehensiveReport): EmailTemplate {
    const subject = `${report.metadata.reportType} - ${report.metadata.organizationName} (${format(new Date(report.metadata.generatedAt), 'MMM dd, yyyy')})`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8fafc; padding: 20px; }
            .summary-card { background-color: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #3b82f6; }
            .metric { display: inline-block; margin: 10px 15px 10px 0; text-align: center; }
            .metric-value { font-size: 24px; font-weight: bold; color: #1f2937; }
            .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
            .recommendation { background-color: #dbeafe; padding: 10px; margin: 5px 0; border-radius: 4px; border-left: 3px solid #3b82f6; }
            .footer { background-color: #1f2937; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
            .alert { background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 10px; border-radius: 4px; margin: 10px 0; }
            .success { background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background-color: #f9fafb; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">${report.metadata.reportType}</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${report.metadata.organizationName}</p>
            <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">${report.metadata.dateRange}</p>
          </div>
          
          <div class="content">
            ${report.production ? this.generateProductionSummaryHTML(report.production) : ''}
            ${report.attendance ? this.generateAttendanceSummaryHTML(report.attendance) : ''}
            ${report.insights ? this.generateInsightsHTML(report.insights) : ''}
          </div>
          
          <div class="footer">
            <p>Generated on ${format(new Date(report.metadata.generatedAt), 'MMMM dd, yyyy \'at\' HH:mm')}</p>
            <p>Poultry Farm Management System</p>
          </div>
        </body>
      </html>
    `

    const text = `
${report.metadata.reportType}
${report.metadata.organizationName}
${report.metadata.dateRange}

${report.production ? this.generateProductionSummaryText(report.production) : ''}
${report.attendance ? this.generateAttendanceSummaryText(report.attendance) : ''}
${report.insights ? this.generateInsightsText(report.insights) : ''}

Generated on ${format(new Date(report.metadata.generatedAt), 'MMMM dd, yyyy \'at\' HH:mm')}
Poultry Farm Management System
    `

    return { subject, html, text }
  }

  private static generateProductionSummaryHTML(production: any): string {
    return `
      <div class="summary-card">
        <h2 style="margin-top: 0; color: #1f2937;">🥚 Production Summary</h2>
        <div style="display: flex; flex-wrap: wrap;">
          <div class="metric">
            <div class="metric-value" style="color: #3b82f6;">${production.summary.totalEggs.toLocaleString()}</div>
            <div class="metric-label">Total Eggs</div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #10b981;">${production.summary.sellableEggs.toLocaleString()}</div>
            <div class="metric-label">Sellable Eggs</div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #ef4444;">${production.summary.lossPercentage.toFixed(1)}%</div>
            <div class="metric-label">Loss Rate</div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #8b5cf6;">${Math.round(production.summary.averageDaily).toLocaleString()}</div>
            <div class="metric-label">Daily Average</div>
          </div>
        </div>
        
        ${production.shedBreakdown.length > 0 ? `
          <h3>Top Performing Sheds</h3>
          <table>
            <thead>
              <tr><th>Shed</th><th>Farm</th><th>Efficiency</th><th>Production</th></tr>
            </thead>
            <tbody>
              ${production.shedBreakdown.slice(0, 5).map((shed: any) => `
                <tr>
                  <td>${shed.shedName}</td>
                  <td>${shed.farmName}</td>
                  <td>${shed.efficiency.toFixed(1)}%</td>
                  <td>${shed.sellableEggs.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
      </div>
    `
  }

  private static generateAttendanceSummaryHTML(attendance: any): string {
    return `
      <div class="summary-card">
        <h2 style="margin-top: 0; color: #1f2937;">👥 Attendance Summary</h2>
        <div style="display: flex; flex-wrap: wrap;">
          <div class="metric">
            <div class="metric-value" style="color: #3b82f6;">${attendance.summary.totalWorkers}</div>
            <div class="metric-label">Total Workers</div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #10b981;">${attendance.summary.averageAttendanceRate.toFixed(1)}%</div>
            <div class="metric-label">Attendance Rate</div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #f59e0b;">${attendance.summary.totalLateDays}</div>
            <div class="metric-label">Late Days</div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #ef4444;">${attendance.summary.totalAbsentDays}</div>
            <div class="metric-label">Absent Days</div>
          </div>
        </div>
      </div>
    `
  }

  private static generateInsightsHTML(insights: any): string {
    return `
      <div class="summary-card">
        <h2 style="margin-top: 0; color: #1f2937;">💡 Insights & Recommendations</h2>
        
        ${insights.productionTrends ? `
          <div class="alert ${insights.productionTrends.trend === 'increasing' ? 'success' : ''}">
            <strong>Production Trend:</strong> ${insights.productionTrends.description}
          </div>
        ` : ''}
        
        ${insights.attendanceInsights ? `
          <div class="alert ${insights.attendanceInsights.trend === 'improving' ? 'success' : ''}">
            <strong>Attendance Trend:</strong> ${insights.attendanceInsights.description}
          </div>
        ` : ''}
        
        ${insights.recommendations && insights.recommendations.length > 0 ? `
          <h3>Recommendations</h3>
          ${insights.recommendations.map((rec: string, index: number) => `
            <div class="recommendation">
              <strong>${index + 1}.</strong> ${rec}
            </div>
          `).join('')}
        ` : ''}
      </div>
    `
  }

  private static generateProductionSummaryText(production: any): string {
    return `
PRODUCTION SUMMARY
==================
Total Eggs: ${production.summary.totalEggs.toLocaleString()}
Sellable Eggs: ${production.summary.sellableEggs.toLocaleString()}
Loss Rate: ${production.summary.lossPercentage.toFixed(1)}%
Daily Average: ${Math.round(production.summary.averageDaily).toLocaleString()}
Days Reported: ${production.summary.daysReported}
    `
  }

  private static generateAttendanceSummaryText(attendance: any): string {
    return `
ATTENDANCE SUMMARY
==================
Total Workers: ${attendance.summary.totalWorkers}
Attendance Rate: ${attendance.summary.averageAttendanceRate.toFixed(1)}%
Present Days: ${attendance.summary.totalPresentDays}
Absent Days: ${attendance.summary.totalAbsentDays}
Late Days: ${attendance.summary.totalLateDays}
    `
  }

  private static generateInsightsText(insights: any): string {
    let text = `
INSIGHTS & RECOMMENDATIONS
==========================
`
    
    if (insights.productionTrends) {
      text += `Production Trend: ${insights.productionTrends.description}\n`
    }
    
    if (insights.attendanceInsights) {
      text += `Attendance Trend: ${insights.attendanceInsights.description}\n`
    }
    
    if (insights.recommendations && insights.recommendations.length > 0) {
      text += `\nRecommendations:\n`
      insights.recommendations.forEach((rec: string, index: number) => {
        text += `${index + 1}. ${rec}\n`
      })
    }
    
    return text
  }

  // Send notification emails
  static async sendNotificationEmail(
    recipients: string[],
    subject: string,
    message: string,
    type: 'info' | 'warning' | 'error' = 'info'
  ): Promise<void> {
    const colors = {
      info: '#3b82f6',
      warning: '#f59e0b',
      error: '#ef4444'
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .notification { background-color: white; border-left: 4px solid ${colors[type]}; padding: 20px; border-radius: 4px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="notification">
            <h2 style="margin-top: 0; color: ${colors[type]};">${subject}</h2>
            <p>${message}</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from your Poultry Farm Management System.</p>
            <p>Generated on ${format(new Date(), 'MMMM dd, yyyy \'at\' HH:mm')}</p>
          </div>
        </body>
      </html>
    `

    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'notifications@poultryfarmsaas.com',
        to: recipients,
        subject,
        html,
        text: `${subject}\n\n${message}\n\nThis is an automated notification from your Poultry Farm Management System.\nGenerated on ${format(new Date(), 'MMMM dd, yyyy \'at\' HH:mm')}`
      })
    } catch (error) {
      console.error('Failed to send notification email:', error)
      throw new Error('Failed to send notification email')
    }
  }
}