import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import type { ComprehensiveReport, ProductionReport, AttendanceReport } from './reports'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export class ExportService {
  // PDF Export Functions
  static exportToPDF(report: ComprehensiveReport): void {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const margin = 20

    // Title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(report.metadata.reportType, margin, 30)

    // Metadata
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Organization: ${report.metadata.organizationName}`, margin, 45)
    doc.text(`Date Range: ${report.metadata.dateRange}`, margin, 55)
    doc.text(`Generated: ${format(new Date(report.metadata.generatedAt), 'MMM dd, yyyy HH:mm')}`, margin, 65)

    let yPosition = 85

    // Production Summary
    if (report.production) {
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Production Summary', margin, yPosition)
      yPosition += 15

      const productionData = [
        ['Metric', 'Value'],
        ['Total Eggs', report.production.summary.totalEggs.toLocaleString()],
        ['Sellable Eggs', report.production.summary.sellableEggs.toLocaleString()],
        ['Broken Eggs', report.production.summary.brokenEggs.toLocaleString()],
        ['Damaged Eggs', report.production.summary.damagedEggs.toLocaleString()],
        ['Loss Percentage', `${report.production.summary.lossPercentage.toFixed(1)}%`],
        ['Average Daily', Math.round(report.production.summary.averageDaily).toLocaleString()],
        ['Days Reported', report.production.summary.daysReported.toString()]
      ]

      doc.autoTable({
        startY: yPosition,
        head: [productionData[0]],
        body: productionData.slice(1),
        margin: { left: margin, right: margin },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] }
      })

      yPosition = (doc as any).lastAutoTable.finalY + 20

      // Shed Performance
      if (report.production.shedBreakdown.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Shed Performance', margin, yPosition)
        yPosition += 10

        const shedData = [
          ['Shed Name', 'Farm', 'Total Production', 'Efficiency %']
        ]

        report.production.shedBreakdown
          .sort((a, b) => b.efficiency - a.efficiency)
          .slice(0, 10)
          .forEach(shed => {
            shedData.push([
              shed.shedName,
              shed.farmName,
              shed.sellableEggs.toLocaleString(),
              shed.efficiency.toFixed(1)
            ])
          })

        doc.autoTable({
          startY: yPosition,
          head: [shedData[0]],
          body: shedData.slice(1),
          margin: { left: margin, right: margin },
          styles: { fontSize: 9 },
          headStyles: { fillColor: [16, 185, 129] }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 20
      }
    }

    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 30
    }

    // Attendance Summary
    if (report.attendance) {
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Attendance Summary', margin, yPosition)
      yPosition += 15

      const attendanceData = [
        ['Metric', 'Value'],
        ['Total Workers', report.attendance.summary.totalWorkers.toString()],
        ['Average Attendance Rate', `${report.attendance.summary.averageAttendanceRate.toFixed(1)}%`],
        ['Total Present Days', report.attendance.summary.totalPresentDays.toString()],
        ['Total Absent Days', report.attendance.summary.totalAbsentDays.toString()],
        ['Total Late Days', report.attendance.summary.totalLateDays.toString()]
      ]

      doc.autoTable({
        startY: yPosition,
        head: [attendanceData[0]],
        body: attendanceData.slice(1),
        margin: { left: margin, right: margin },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [245, 158, 11] }
      })

      yPosition = (doc as any).lastAutoTable.finalY + 20

      // Worker Performance
      if (report.attendance.workerBreakdown.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Worker Performance', margin, yPosition)
        yPosition += 10

        const workerData = [
          ['Worker Name', 'Total Days', 'Present', 'Absent', 'Late', 'Rate %']
        ]

        report.attendance.workerBreakdown
          .sort((a, b) => b.attendanceRate - a.attendanceRate)
          .slice(0, 10)
          .forEach(worker => {
            workerData.push([
              worker.userName,
              worker.totalDays.toString(),
              worker.presentDays.toString(),
              worker.absentDays.toString(),
              worker.lateDays.toString(),
              worker.attendanceRate.toFixed(1)
            ])
          })

        doc.autoTable({
          startY: yPosition,
          head: [workerData[0]],
          body: workerData.slice(1),
          margin: { left: margin, right: margin },
          styles: { fontSize: 9 },
          headStyles: { fillColor: [139, 69, 19] }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 20
      }
    }

    // Recommendations
    if (report.insights?.recommendations && report.insights.recommendations.length > 0) {
      if (yPosition > 200) {
        doc.addPage()
        yPosition = 30
      }

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Recommendations', margin, yPosition)
      yPosition += 15

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      report.insights.recommendations.forEach((recommendation, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${recommendation}`, pageWidth - 2 * margin)
        doc.text(lines, margin, yPosition)
        yPosition += lines.length * 5 + 5
        
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 30
        }
      })
    }

    // Save the PDF
    const fileName = `${report.metadata.reportType.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`
    doc.save(fileName)
  }

  // Excel Export Functions
  static exportToExcel(report: ComprehensiveReport): void {
    const workbook = XLSX.utils.book_new()

    // Metadata Sheet
    const metadataData = [
      ['Report Type', report.metadata.reportType],
      ['Organization', report.metadata.organizationName],
      ['Date Range', report.metadata.dateRange],
      ['Generated At', format(new Date(report.metadata.generatedAt), 'MMM dd, yyyy HH:mm')],
      ['Generated By', report.metadata.generatedBy]
    ]
    const metadataSheet = XLSX.utils.aoa_to_sheet(metadataData)
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata')

    // Production Summary Sheet
    if (report.production) {
      const productionSummaryData = [
        ['Metric', 'Value'],
        ['Total Eggs', report.production.summary.totalEggs],
        ['Sellable Eggs', report.production.summary.sellableEggs],
        ['Broken Eggs', report.production.summary.brokenEggs],
        ['Damaged Eggs', report.production.summary.damagedEggs],
        ['Loss Percentage', report.production.summary.lossPercentage],
        ['Average Daily', report.production.summary.averageDaily],
        ['Days Reported', report.production.summary.daysReported]
      ]
      const productionSummarySheet = XLSX.utils.aoa_to_sheet(productionSummaryData)
      XLSX.utils.book_append_sheet(workbook, productionSummarySheet, 'Production Summary')

      // Daily Production Sheet
      if (report.production.dailyData.length > 0) {
        const dailyProductionData = [
          ['Date', 'Total Eggs', 'Sellable Eggs', 'Broken Eggs', 'Damaged Eggs', 'Loss %']
        ]
        report.production.dailyData.forEach(day => {
          dailyProductionData.push([
            day.date,
            day.totalEggs,
            day.sellableEggs,
            day.brokenEggs,
            day.damagedEggs,
            day.lossPercentage
          ])
        })
        const dailyProductionSheet = XLSX.utils.aoa_to_sheet(dailyProductionData)
        XLSX.utils.book_append_sheet(workbook, dailyProductionSheet, 'Daily Production')
      }

      // Shed Performance Sheet
      if (report.production.shedBreakdown.length > 0) {
        const shedPerformanceData = [
          ['Shed Name', 'Farm Name', 'Total Eggs', 'Sellable Eggs', 'Efficiency %', 'Capacity']
        ]
        report.production.shedBreakdown.forEach(shed => {
          shedPerformanceData.push([
            shed.shedName,
            shed.farmName,
            shed.totalEggs,
            shed.sellableEggs,
            shed.efficiency,
            shed.capacity
          ])
        })
        const shedPerformanceSheet = XLSX.utils.aoa_to_sheet(shedPerformanceData)
        XLSX.utils.book_append_sheet(workbook, shedPerformanceSheet, 'Shed Performance')
      }
    }

    // Attendance Summary Sheet
    if (report.attendance) {
      const attendanceSummaryData = [
        ['Metric', 'Value'],
        ['Total Workers', report.attendance.summary.totalWorkers],
        ['Average Attendance Rate', report.attendance.summary.averageAttendanceRate],
        ['Total Working Days', report.attendance.summary.totalWorkingDays],
        ['Total Present Days', report.attendance.summary.totalPresentDays],
        ['Total Absent Days', report.attendance.summary.totalAbsentDays],
        ['Total Late Days', report.attendance.summary.totalLateDays]
      ]
      const attendanceSummarySheet = XLSX.utils.aoa_to_sheet(attendanceSummaryData)
      XLSX.utils.book_append_sheet(workbook, attendanceSummarySheet, 'Attendance Summary')

      // Worker Performance Sheet
      if (report.attendance.workerBreakdown.length > 0) {
        const workerPerformanceData = [
          ['Worker Name', 'Total Days', 'Present Days', 'Absent Days', 'Late Days', 'Attendance Rate %', 'Status']
        ]
        report.attendance.workerBreakdown.forEach(worker => {
          workerPerformanceData.push([
            worker.userName,
            worker.totalDays,
            worker.presentDays,
            worker.absentDays,
            worker.lateDays,
            worker.attendanceRate,
            worker.status
          ])
        })
        const workerPerformanceSheet = XLSX.utils.aoa_to_sheet(workerPerformanceData)
        XLSX.utils.book_append_sheet(workbook, workerPerformanceSheet, 'Worker Performance')
      }

      // Daily Attendance Sheet
      if (report.attendance.dailyAttendance.length > 0) {
        const dailyAttendanceData = [
          ['Date', 'Total Workers', 'Present Workers', 'Absent Workers', 'Late Workers', 'Attendance Rate %']
        ]
        report.attendance.dailyAttendance.forEach(day => {
          dailyAttendanceData.push([
            day.date,
            day.totalWorkers,
            day.presentWorkers,
            day.absentWorkers,
            day.lateWorkers,
            day.attendanceRate
          ])
        })
        const dailyAttendanceSheet = XLSX.utils.aoa_to_sheet(dailyAttendanceData)
        XLSX.utils.book_append_sheet(workbook, dailyAttendanceSheet, 'Daily Attendance')
      }
    }

    // Insights Sheet
    if (report.insights) {
      const insightsData = [
        ['Category', 'Description'],
        ['Production Trend', report.insights.productionTrends?.description || 'N/A'],
        ['Attendance Trend', report.insights.attendanceInsights?.description || 'N/A']
      ]

      if (report.insights.recommendations) {
        insightsData.push(['', ''])
        insightsData.push(['Recommendations', ''])
        report.insights.recommendations.forEach((rec, index) => {
          insightsData.push([`${index + 1}`, rec])
        })
      }

      const insightsSheet = XLSX.utils.aoa_to_sheet(insightsData)
      XLSX.utils.book_append_sheet(workbook, insightsSheet, 'Insights')
    }

    // Save the Excel file
    const fileName = `${report.metadata.reportType.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  // CSV Export Functions
  static exportProductionToCSV(production: ProductionReport): void {
    const csvData = [
      ['Date', 'Total Eggs', 'Sellable Eggs', 'Broken Eggs', 'Damaged Eggs', 'Loss Percentage']
    ]

    production.dailyData.forEach(day => {
      csvData.push([
        day.date,
        day.totalEggs.toString(),
        day.sellableEggs.toString(),
        day.brokenEggs.toString(),
        day.damagedEggs.toString(),
        day.lossPercentage.toFixed(2)
      ])
    })

    this.downloadCSV(csvData, `Production_Data_${format(new Date(), 'yyyy-MM-dd')}.csv`)
  }

  static exportAttendanceToCSV(attendance: AttendanceReport): void {
    const csvData = [
      ['Worker Name', 'Total Days', 'Present Days', 'Absent Days', 'Late Days', 'Attendance Rate', 'Status']
    ]

    attendance.workerBreakdown.forEach(worker => {
      csvData.push([
        worker.userName,
        worker.totalDays.toString(),
        worker.presentDays.toString(),
        worker.absentDays.toString(),
        worker.lateDays.toString(),
        worker.attendanceRate.toFixed(2),
        worker.status
      ])
    })

    this.downloadCSV(csvData, `Attendance_Data_${format(new Date(), 'yyyy-MM-dd')}.csv`)
  }

  static exportShedPerformanceToCSV(shedData: any[]): void {
    const csvData = [
      ['Shed Name', 'Farm Name', 'Total Production', 'Sellable Eggs', 'Efficiency %', 'Capacity']
    ]

    shedData.forEach(shed => {
      csvData.push([
        shed.shedName,
        shed.farmName,
        shed.totalEggs.toString(),
        shed.sellableEggs.toString(),
        shed.efficiency.toFixed(2),
        shed.capacity.toString()
      ])
    })

    this.downloadCSV(csvData, `Shed_Performance_${format(new Date(), 'yyyy-MM-dd')}.csv`)
  }

  // Helper function to download CSV
  private static downloadCSV(data: string[][], filename: string): void {
    const csvContent = data.map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Quick export functions for different formats
  static exportReport(report: ComprehensiveReport, format: 'pdf' | 'excel' | 'csv'): void {
    switch (format) {
      case 'pdf':
        this.exportToPDF(report)
        break
      case 'excel':
        this.exportToExcel(report)
        break
      case 'csv':
        // For CSV, export production data by default
        if (report.production) {
          this.exportProductionToCSV(report.production)
        }
        break
      default:
        throw new Error('Unsupported export format')
    }
  }
}