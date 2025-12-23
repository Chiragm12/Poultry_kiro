"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Egg,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react"
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { toast } from "sonner"

interface Farm {
  id: string
  name: string
}

interface Shed {
  id: string
  name: string
  farmId: string
}

interface Manager {
  id: string
  name: string
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [farms, setFarms] = useState<Farm[]>([])
  const [sheds, setSheds] = useState<Shed[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [filteredSheds, setFilteredSheds] = useState<Shed[]>([])

  // Form state
  const [reportType, setReportType] = useState("comprehensive")
  const [dateRange, setDateRange] = useState("30d")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [selectedFarm, setSelectedFarm] = useState("all-farms")
  const [selectedShed, setSelectedShed] = useState("all-sheds")
  const [selectedManager, setSelectedManager] = useState("all-managers")

  useEffect(() => {
    fetchFilters()
  }, [])

  useEffect(() => {
    if (selectedFarm && selectedFarm !== "all-farms") {
      setFilteredSheds(sheds.filter(shed => shed.farmId === selectedFarm))
      setSelectedShed("all-sheds")
    } else {
      setFilteredSheds(sheds)
    }
  }, [selectedFarm, sheds])

  const fetchFilters = async () => {
    try {
      const [farmsRes, shedsRes, managersRes] = await Promise.all([
        fetch("/api/farms"),
        fetch("/api/sheds"),
        fetch("/api/users?role=MANAGER,OWNER")
      ])

      const [farmsData, shedsData, managersData] = await Promise.all([
        farmsRes.json(),
        shedsRes.json(),
        managersRes.json()
      ])

      if (farmsRes.ok) setFarms(farmsData.data || [])
      if (shedsRes.ok) setSheds(shedsData.data || [])
      if (managersRes.ok) setManagers(managersData.data || [])
    } catch (error) {
      console.error("Error fetching filters:", error)
      toast.error("Failed to load filter options")
    }
  }

  const getDateRange = () => {
    const now = new Date()
    
    switch (dateRange) {
      case "7d":
        return { startDate: subDays(now, 7), endDate: now }
      case "30d":
        return { startDate: subDays(now, 30), endDate: now }
      case "90d":
        return { startDate: subDays(now, 90), endDate: now }
      case "week":
        return { startDate: startOfWeek(now), endDate: endOfWeek(now) }
      case "month":
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) }
      case "custom":
        return {
          startDate: customStartDate ? new Date(customStartDate) : subDays(now, 30),
          endDate: customEndDate ? new Date(customEndDate) : now
        }
      default:
        return { startDate: subDays(now, 30), endDate: now }
    }
  }

  const generateReport = async () => {
    setLoading(true)
    
    try {
      const { startDate, endDate } = getDateRange()
      
      const requestBody = {
        reportType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        farmId: selectedFarm !== "all-farms" ? selectedFarm : undefined,
        shedId: selectedShed !== "all-sheds" ? selectedShed : undefined,
        managerId: selectedManager !== "all-managers" ? selectedManager : undefined
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate report")
      }

      setReportData(result.data)
      toast.success("Report generated successfully")
    } catch (error) {
      console.error("Error generating report:", error)
      toast.error(error instanceof Error ? error.message : "Failed to generate report")
    } finally {
      setLoading(false)
    }
  }

  const exportReport = (format: 'pdf' | 'csv' | 'excel') => {
    if (!reportData) {
      toast.error("No report data to export")
      return
    }

    try {
      // Create export data based on format
      let exportData: any
      let filename: string
      let mimeType: string

      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')
      
      if (format === 'csv') {
        // Convert report data to CSV
        exportData = convertToCSV(reportData)
        filename = `report-${timestamp}.csv`
        mimeType = 'text/csv'
      } else if (format === 'excel') {
        toast.info("Excel export coming soon")
        return
      } else if (format === 'pdf') {
        toast.info("PDF export coming soon")
        return
      }

      // Create download link
      const blob = new Blob([exportData], { type: mimeType })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Report exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export report")
    }
  }

  const convertToCSV = (data: any): string => {
    const lines: string[] = []
    
    // Add metadata
    lines.push(`Report Type,${data.metadata?.reportType || 'N/A'}`)
    lines.push(`Organization,${data.metadata?.organizationName || 'N/A'}`)
    lines.push(`Date Range,${data.metadata?.dateRange || 'N/A'}`)
    lines.push(`Generated At,${data.metadata?.generatedAt || new Date().toISOString()}`)
    lines.push('') // Empty line

    // Add production summary
    if (data.production) {
      lines.push('PRODUCTION SUMMARY')
      lines.push('Metric,Value')
      lines.push(`Total Eggs,${data.production.summary.totalEggs}`)
      lines.push(`Sellable Eggs,${data.production.summary.sellableEggs}`)
      lines.push(`Damaged Eggs,${data.production.summary.damagedEggs || 0}`)
      lines.push(`Loss Percentage,${data.production.summary.lossPercentage.toFixed(2)}%`)
      lines.push(`Average Daily,${data.production.summary.averageDaily.toFixed(2)}`)
      lines.push('') // Empty line

      // Add shed breakdown
      if (data.production.shedBreakdown?.length > 0) {
        lines.push('SHED PERFORMANCE')
        lines.push('Shed Name,Farm Name,Total Eggs,Sellable Eggs,Efficiency')
        data.production.shedBreakdown.forEach((shed: any) => {
          lines.push(`${shed.shedName},${shed.farmName},${shed.totalEggs},${shed.sellableEggs},${shed.efficiency.toFixed(2)}%`)
        })
        lines.push('') // Empty line
      }
    }

    // Add attendance summary
    if (data.attendance) {
      lines.push('ATTENDANCE SUMMARY')
      lines.push('Metric,Value')
      lines.push(`Total Workers,${data.attendance.summary.totalWorkers}`)
      lines.push(`Average Attendance Rate,${data.attendance.summary.averageAttendanceRate.toFixed(2)}%`)
      lines.push(`Total Late Days,${data.attendance.summary.totalLateDays}`)
      lines.push(`Total Absent Days,${data.attendance.summary.totalAbsentDays}`)
      lines.push('') // Empty line

      // Add worker breakdown
      if (data.attendance.workerBreakdown?.length > 0) {
        lines.push('WORKER PERFORMANCE')
        lines.push('Worker Name,Total Days,Present Days,Late Days,Absent Days,Attendance Rate,Status')
        data.attendance.workerBreakdown.forEach((worker: any) => {
          lines.push(`${worker.userName},${worker.totalDays},${worker.presentDays},${worker.lateDays},${worker.absentDays},${worker.attendanceRate.toFixed(2)}%,${worker.status}`)
        })
      }
    }

    return lines.join('\n')
  }

  if (!session?.user) {
    return null
  }

  const canViewReports = ["OWNER", "MANAGER"].includes(session.user.role)

  if (!canViewReports) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to view reports. Contact your administrator.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-1">
              Generate comprehensive reports for your farm operations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Configuration */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Report Configuration</CardTitle>
                <CardDescription>
                  Configure your report parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger id="reportType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprehensive">Comprehensive Report</SelectItem>
                      <SelectItem value="production">Production Report</SelectItem>
                      <SelectItem value="attendance">Attendance Report</SelectItem>
                      <SelectItem value="daily">Daily Summary</SelectItem>
                      <SelectItem value="weekly">Weekly Summary</SelectItem>
                      <SelectItem value="monthly">Monthly Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateRange">Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger id="dateRange">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="week">This week</SelectItem>
                      <SelectItem value="month">This month</SelectItem>
                      <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {dateRange === "custom" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="farm">Farm (Optional)</Label>
                  <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                    <SelectTrigger id="farm">
                      <SelectValue placeholder="All farms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-farms">All farms</SelectItem>
                      {farms.map((farm) => (
                        <SelectItem key={farm.id} value={farm.id}>
                          {farm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shed">Shed (Optional)</Label>
                  <Select value={selectedShed} onValueChange={setSelectedShed}>
                    <SelectTrigger id="shed">
                      <SelectValue placeholder="All sheds" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-sheds">All sheds</SelectItem>
                      {filteredSheds.map((shed) => (
                        <SelectItem key={shed.id} value={shed.id}>
                          {shed.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {session.user.role === "OWNER" && (
                  <div className="space-y-2">
                    <Label htmlFor="manager">Manager (Optional)</Label>
                    <Select value={selectedManager} onValueChange={setSelectedManager}>
                      <SelectTrigger id="manager">
                        <SelectValue placeholder="All managers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-managers">All managers</SelectItem>
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button 
                  onClick={generateReport} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Report Display */}
          <div className="lg:col-span-2">
            {reportData ? (
              <div className="space-y-6">
                {/* Report Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <FileText className="mr-2 h-5 w-5" />
                          {reportData.metadata?.reportType || "Report"}
                        </CardTitle>
                        <CardDescription>
                          {reportData.metadata?.organizationName} • {reportData.metadata?.dateRange}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          <Clock className="mr-1 h-3 w-3" />
                          {reportData.metadata?.generatedAt ? 
                            format(new Date(reportData.metadata.generatedAt), 'MMM dd, HH:mm') : 
                            'Just now'
                          }
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => exportReport('csv')}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export CSV
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Production Summary */}
                {reportData.production && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Egg className="mr-2 h-5 w-5" />
                        Production Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {reportData.production.summary.totalEggs?.toLocaleString() || 0}
                          </div>
                          <div className="text-sm text-gray-500">Total Eggs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {reportData.production.summary.sellableEggs?.toLocaleString() || 0}
                          </div>
                          <div className="text-sm text-gray-500">Sellable Eggs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {reportData.production.summary.lossPercentage?.toFixed(1) || 0}%
                          </div>
                          <div className="text-sm text-gray-500">Loss Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {Math.round(reportData.production.summary.averageDaily || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">Daily Average</div>
                        </div>
                      </div>

                      {reportData.production.shedBreakdown && reportData.production.shedBreakdown.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Top Performing Sheds</h4>
                          <div className="space-y-2">
                            {reportData.production.shedBreakdown
                              .sort((a: any, b: any) => (b.efficiency || 0) - (a.efficiency || 0))
                              .slice(0, 5)
                              .map((shed: any, index: number) => (
                                <div key={shed.shedId || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <div className="font-medium">{shed.shedName || 'Unknown'}</div>
                                    <div className="text-sm text-gray-500">{shed.farmName || 'Unknown'}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">{(shed.efficiency || 0).toFixed(1)}%</div>
                                    <div className="text-sm text-gray-500">
                                      {(shed.sellableEggs || 0).toLocaleString()} eggs
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Attendance Summary */}
                {reportData.attendance && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="mr-2 h-5 w-5" />
                        Attendance Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {reportData.attendance.summary.totalWorkers || 0}
                          </div>
                          <div className="text-sm text-gray-500">Total Workers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {reportData.attendance.summary.averageAttendanceRate?.toFixed(1) || 0}%
                          </div>
                          <div className="text-sm text-gray-500">Attendance Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {reportData.attendance.summary.totalLateDays || 0}
                          </div>
                          <div className="text-sm text-gray-500">Late Days</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {reportData.attendance.summary.totalAbsentDays || 0}
                          </div>
                          <div className="text-sm text-gray-500">Absent Days</div>
                        </div>
                      </div>

                      {reportData.attendance.workerBreakdown && reportData.attendance.workerBreakdown.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Worker Performance</h4>
                          <div className="space-y-2">
                            {reportData.attendance.workerBreakdown
                              .sort((a: any, b: any) => (b.attendanceRate || 0) - (a.attendanceRate || 0))
                              .slice(0, 5)
                              .map((worker: any, index: number) => (
                                <div key={worker.userId || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <div className="font-medium">{worker.userName || 'Unknown'}</div>
                                    <div className="text-sm text-gray-500">
                                      {(worker.presentDays || 0) + (worker.lateDays || 0)}/{worker.totalDays || 0} days
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="text-right">
                                      <div className="font-medium">{(worker.attendanceRate || 0).toFixed(1)}%</div>
                                    </div>
                                    <Badge variant={
                                      worker.status === 'excellent' ? 'default' :
                                      worker.status === 'good' ? 'secondary' : 'destructive'
                                    }>
                                      {worker.status === 'excellent' ? 'Excellent' :
                                       worker.status === 'good' ? 'Good' : 'Needs Improvement'}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Insights and Recommendations */}
                {reportData.insights && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="mr-2 h-5 w-5" />
                        Insights & Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {reportData.insights.productionTrends && (
                        <div>
                          <h4 className="font-medium mb-2">Production Trends</h4>
                          <p className="text-sm text-gray-600">
                            {reportData.insights.productionTrends.description}
                          </p>
                        </div>
                      )}

                      {reportData.insights.attendanceInsights && (
                        <div>
                          <h4 className="font-medium mb-2">Attendance Insights</h4>
                          <p className="text-sm text-gray-600">
                            {reportData.insights.attendanceInsights.description}
                          </p>
                        </div>
                      )}

                      {reportData.insights.recommendations && reportData.insights.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Recommendations</h4>
                          <div className="space-y-2">
                            {reportData.insights.recommendations.map((recommendation: string, index: number) => (
                              <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-blue-800">{recommendation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Configure your report parameters and click "Generate Report" to view your data.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}