"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Upload,
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Egg,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye
} from "lucide-react"
import { toast } from "sonner"
import { format, parseISO, isValid } from "date-fns"

interface ImportedData {
  headers: string[]
  rows: any[]
  summary: {
    totalRecords: number
    dateRange: { start: string; end: string }
    totalEggs: number
    averageDaily: number
    peakProduction: { date: string; eggs: number }
    lowestProduction: { date: string; eggs: number }
    mortalityRate: number
    efficiency: number
  }
  analytics: {
    weeklyTrends: Array<{
      week: number
      totalEggs: number
      averageDaily: number
      efficiency: number
    }>
    monthlyTrends: Array<{
      month: string
      totalEggs: number
      averageDaily: number
      efficiency: number
    }>
    productionTrends: Array<{
      date: string
      eggs: number
      mortality: number
      efficiency: number
    }>
  }
}

export default function CSVImportAnalytics() {
  const [importedData, setImportedData] = useState<ImportedData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.xlsx')) {
      setError("Please upload a CSV or Excel file")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const text = await file.text()
      const parsedData = parseCSVData(text)
      setImportedData(parsedData)
      toast.success("Data imported and analyzed successfully!")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to parse file"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const parseCSVData = (csvText: string): ImportedData => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header row and one data row")
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      return row
    })

    // Analyze the data
    const analytics = analyzeData(rows, headers)
    
    return {
      headers,
      rows,
      summary: analytics.summary,
      analytics: analytics.trends
    }
  }

  const analyzeData = (rows: any[], headers: string[]) => {
    // Find relevant columns (flexible matching)
    const dateCol = findColumn(headers, ['date', 'Date', 'DATE', 'day', 'Day'])
    const eggCols = findColumns(headers, ['egg', 'Egg', 'total', 'Total', 'daily', 'Daily'])
    const mortalityCol = findColumn(headers, ['mortality', 'Mortality', 'mort', 'Mort', 'death', 'Death'])
    const maleCol = findColumn(headers, ['male', 'Male', 'cock', 'Cock'])
    const femaleCol = findColumn(headers, ['female', 'Female', 'hen', 'Hen'])

    let totalEggs = 0
    let totalMortality = 0
    let validRecords = 0
    let peakProduction = { date: '', eggs: 0 }
    let lowestProduction = { date: '', eggs: Number.MAX_SAFE_INTEGER }
    const productionTrends: Array<{ date: string; eggs: number; mortality: number; efficiency: number }> = []
    const dates: string[] = []

    // Process each row
    rows.forEach(row => {
      const dateValue = dateCol ? row[dateCol] : ''
      let dailyEggs = 0
      let dailyMortality = 0

      // Sum up egg production from multiple columns
      eggCols.forEach(col => {
        const value = parseFloat(row[col]) || 0
        dailyEggs += value
      })

      // Calculate mortality
      if (mortalityCol) {
        dailyMortality = parseFloat(row[mortalityCol]) || 0
      } else if (maleCol && femaleCol) {
        const maleMort = parseFloat(row[maleCol]) || 0
        const femaleMort = parseFloat(row[femaleCol]) || 0
        dailyMortality = maleMort + femaleMort
      }

      if (dailyEggs > 0) {
        totalEggs += dailyEggs
        totalMortality += dailyMortality
        validRecords++

        if (dailyEggs > peakProduction.eggs) {
          peakProduction = { date: dateValue, eggs: dailyEggs }
        }
        if (dailyEggs < lowestProduction.eggs) {
          lowestProduction = { date: dateValue, eggs: dailyEggs }
        }

        productionTrends.push({
          date: dateValue,
          eggs: dailyEggs,
          mortality: dailyMortality,
          efficiency: dailyEggs > 0 ? ((dailyEggs / (dailyEggs + dailyMortality)) * 100) : 0
        })

        if (dateValue) dates.push(dateValue)
      }
    })

    // Calculate weekly and monthly trends
    const weeklyTrends = calculateWeeklyTrends(productionTrends)
    const monthlyTrends = calculateMonthlyTrends(productionTrends)

    const averageDaily = validRecords > 0 ? totalEggs / validRecords : 0
    const mortalityRate = totalEggs > 0 ? (totalMortality / (totalEggs + totalMortality)) * 100 : 0
    const efficiency = totalEggs > 0 ? ((totalEggs / (totalEggs + totalMortality)) * 100) : 0

    return {
      summary: {
        totalRecords: validRecords,
        dateRange: {
          start: dates.length > 0 ? dates[0] : '',
          end: dates.length > 0 ? dates[dates.length - 1] : ''
        },
        totalEggs,
        averageDaily,
        peakProduction,
        lowestProduction: lowestProduction.eggs === Number.MAX_SAFE_INTEGER ? 
          { date: '', eggs: 0 } : lowestProduction,
        mortalityRate,
        efficiency
      },
      trends: {
        weeklyTrends,
        monthlyTrends,
        productionTrends: productionTrends.slice(0, 30) // Show last 30 days
      }
    }
  }

  const findColumn = (headers: string[], patterns: string[]): string | null => {
    for (const pattern of patterns) {
      const found = headers.find(h => 
        h.toLowerCase().includes(pattern.toLowerCase())
      )
      if (found) return found
    }
    return null
  }

  const findColumns = (headers: string[], patterns: string[]): string[] => {
    const found: string[] = []
    for (const pattern of patterns) {
      headers.forEach(h => {
        if (h.toLowerCase().includes(pattern.toLowerCase()) && !found.includes(h)) {
          found.push(h)
        }
      })
    }
    return found
  }

  const calculateWeeklyTrends = (data: any[]) => {
    // Group by weeks (simplified - every 7 records)
    const weeks: any[] = []
    for (let i = 0; i < data.length; i += 7) {
      const weekData = data.slice(i, i + 7)
      const totalEggs = weekData.reduce((sum, d) => sum + d.eggs, 0)
      const averageDaily = weekData.length > 0 ? totalEggs / weekData.length : 0
      const avgEfficiency = weekData.length > 0 ? 
        weekData.reduce((sum, d) => sum + d.efficiency, 0) / weekData.length : 0

      weeks.push({
        week: Math.floor(i / 7) + 1,
        totalEggs,
        averageDaily,
        efficiency: avgEfficiency
      })
    }
    return weeks.slice(0, 12) // Last 12 weeks
  }

  const calculateMonthlyTrends = (data: any[]) => {
    // Group by months (simplified - every 30 records)
    const months: any[] = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    for (let i = 0; i < data.length; i += 30) {
      const monthData = data.slice(i, i + 30)
      const totalEggs = monthData.reduce((sum, d) => sum + d.eggs, 0)
      const averageDaily = monthData.length > 0 ? totalEggs / monthData.length : 0
      const avgEfficiency = monthData.length > 0 ? 
        monthData.reduce((sum, d) => sum + d.efficiency, 0) / monthData.length : 0

      months.push({
        month: monthNames[Math.floor(i / 30) % 12],
        totalEggs,
        averageDaily,
        efficiency: avgEfficiency
      })
    }
    return months.slice(0, 6) // Last 6 months
  }

  const exportAnalytics = () => {
    if (!importedData) return

    const csvContent = [
      'Analytics Summary',
      `Total Records,${importedData.summary.totalRecords}`,
      `Date Range,${importedData.summary.dateRange.start} to ${importedData.summary.dateRange.end}`,
      `Total Eggs,${importedData.summary.totalEggs.toLocaleString()}`,
      `Average Daily,${Math.round(importedData.summary.averageDaily).toLocaleString()}`,
      `Peak Production,${importedData.summary.peakProduction.eggs.toLocaleString()} on ${importedData.summary.peakProduction.date}`,
      `Lowest Production,${importedData.summary.lowestProduction.eggs.toLocaleString()} on ${importedData.summary.lowestProduction.date}`,
      `Mortality Rate,${importedData.summary.mortalityRate.toFixed(2)}%`,
      `Efficiency,${importedData.summary.efficiency.toFixed(2)}%`,
      '',
      'Weekly Trends',
      'Week,Total Eggs,Average Daily,Efficiency %',
      ...importedData.analytics.weeklyTrends.map(w => 
        `${w.week},${w.totalEggs},${Math.round(w.averageDaily)},${w.efficiency.toFixed(1)}`
      ),
      '',
      'Monthly Trends',
      'Month,Total Eggs,Average Daily,Efficiency %',
      ...importedData.analytics.monthlyTrends.map(m => 
        `${m.month},${m.totalEggs},${Math.round(m.averageDaily)},${m.efficiency.toFixed(1)}`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast.success("Analytics exported successfully!")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="mr-2 h-5 w-5" />
          Historical Data Analytics
        </CardTitle>
        <CardDescription>
          Upload your CSV/Excel file to visualize historical production data and get detailed analytics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="csvFile">Upload CSV/Excel File</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                ref={fileInputRef}
                disabled={loading}
                className="mt-1"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="mt-6"
            >
              <Upload className="mr-2 h-4 w-4" />
              {loading ? "Processing..." : "Browse"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-500">
            <p>Supported formats: CSV, Excel (.xlsx, .xls)</p>
            <p>Expected columns: Date, Eggs (various types), Mortality, Male/Female counts</p>
            <div className="mt-2">
              <a 
                href="/sample-data-template.csv" 
                download="sample-data-template.csv"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Download sample CSV template
              </a>
            </div>
          </div>
        </div>

        {/* Analytics Display */}
        {importedData && (
          <div className="space-y-6">
            <Separator />
            
            {/* Summary Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Data Summary</h3>
                <Button variant="outline" size="sm" onClick={exportAnalytics}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Analytics
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {importedData.summary.totalRecords.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700">Total Records</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {importedData.summary.totalEggs.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700">Total Eggs</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(importedData.summary.averageDaily).toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-700">Daily Average</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {importedData.summary.efficiency.toFixed(1)}%
                  </div>
                  <div className="text-sm text-orange-700">Efficiency</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Peak Production</div>
                      <div className="text-lg font-semibold text-green-600">
                        {importedData.summary.peakProduction.eggs.toLocaleString()} eggs
                      </div>
                      <div className="text-xs text-gray-500">
                        {importedData.summary.peakProduction.date}
                      </div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Lowest Production</div>
                      <div className="text-lg font-semibold text-red-600">
                        {importedData.summary.lowestProduction.eggs.toLocaleString()} eggs
                      </div>
                      <div className="text-xs text-gray-500">
                        {importedData.summary.lowestProduction.date}
                      </div>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Trends */}
            {importedData.analytics.weeklyTrends.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Weekly Performance Trends
                </h3>
                <div className="space-y-2">
                  {importedData.analytics.weeklyTrends.map((week) => (
                    <div key={week.week} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">Week {week.week}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-700">Total Eggs</div>
                          <div className="text-lg font-semibold text-green-600">
                            {week.totalEggs.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-700">Daily Avg</div>
                          <div className="text-lg font-semibold text-purple-600">
                            {Math.round(week.averageDaily).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-700">Efficiency</div>
                          <div className="text-lg font-semibold text-orange-600">
                            {week.efficiency.toFixed(1)}%
                          </div>
                        </div>
                        <Badge variant={week.efficiency >= 90 ? 'default' : week.efficiency >= 80 ? 'secondary' : 'destructive'}>
                          {week.efficiency >= 90 ? 'Excellent' : week.efficiency >= 80 ? 'Good' : 'Needs Attention'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Trends */}
            {importedData.analytics.monthlyTrends.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Monthly Performance Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {importedData.analytics.monthlyTrends.map((month) => (
                    <div key={month.month} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 mb-2">{month.month}</div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-sm text-gray-600">Total Eggs</div>
                            <div className="text-xl font-semibold text-blue-600">
                              {month.totalEggs.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Daily Average</div>
                            <div className="text-lg font-semibold text-green-600">
                              {Math.round(month.averageDaily).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Efficiency</div>
                            <div className="text-lg font-semibold text-purple-600">
                              {month.efficiency.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Preview */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Eye className="mr-2 h-5 w-5" />
                Data Preview (First 10 Records)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      {importedData.headers.slice(0, 8).map((header, index) => (
                        <th key={index} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importedData.rows.slice(0, 10).map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {importedData.headers.slice(0, 8).map((header, colIndex) => (
                          <td key={colIndex} className="px-4 py-2 text-sm text-gray-900 border-b">
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importedData.rows.length > 10 && (
                <div className="text-center mt-4 text-sm text-gray-500">
                  Showing 10 of {importedData.rows.length} records
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}