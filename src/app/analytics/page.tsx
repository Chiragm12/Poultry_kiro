"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ProductionTrendChart from "@/components/charts/production-trend-chart"
import ShedPerformanceChart from "@/components/charts/shed-performance-chart"
import EggQualityChart from "@/components/charts/egg-quality-chart"
import AttendanceChart from "@/components/charts/attendance-chart"
import { SkeletonChart, SkeletonStats } from "@/components/ui/loading"
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface AnalyticsData {
  stats: {
    todayProduction: number
    totalProduction: number
    attendanceRate: number
    activeFarms: number
    activeSheds: number
    totalWorkers: number
    productionTrend: number
    attendanceTrend: number
  }
  productionTrend: Array<{
    date: string
    totalEggs: number
    sellableEggs: number
    brokenEggs: number
    damagedEggs: number
  }>
  shedPerformance: Array<{
    shedId: string
    shedName: string
    farmName: string
    totalProduction: number
    averageDaily: number
    efficiency: number
    capacity: number
  }>
  attendanceSummary: Array<{
    userId: string
    userName: string
    totalDays: number
    presentDays: number
    absentDays: number
    lateDays: number
    attendanceRate: number
  }>
  alerts: Array<{
    type: 'low_production' | 'high_damage' | 'capacity_issue'
    message: string
    shedId: string
    shedName: string
    severity: 'low' | 'medium' | 'high'
  }>
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dateRange, setDateRange] = useState("30")
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = async (days: string = dateRange) => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/analytics/dashboard?days=${days}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch analytics")
      }

      setData(result.data)
      setError("")
    } catch (error) {
      console.error("Error fetching analytics:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch analytics")
      toast.error("Failed to load analytics data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const handleDateRangeChange = (value: string) => {
    setDateRange(value)
    fetchAnalytics(value)
  }

  const handleRefresh = () => {
    fetchAnalytics()
    toast.success("Analytics data refreshed")
  }

  if (!session?.user) {
    return null
  }

  const canViewAnalytics = ["OWNER", "MANAGER"].includes(session.user.role)

  if (!canViewAnalytics) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to view analytics. Contact your administrator.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  // Calculate egg quality data for pie chart
  const eggQualityData = data?.productionTrend.reduce(
    (acc, day) => ({
      sellableEggs: acc.sellableEggs + day.sellableEggs,
      brokenEggs: acc.brokenEggs + day.brokenEggs,
      damagedEggs: acc.damagedEggs + day.damagedEggs,
    }),
    { sellableEggs: 0, brokenEggs: 0, damagedEggs: 0 }
  ) || { sellableEggs: 0, brokenEggs: 0, damagedEggs: 0 }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive insights into your farm operations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-6">
            <SkeletonStats />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SkeletonChart />
              <SkeletonChart />
              <SkeletonChart />
              <SkeletonChart />
            </div>
          </div>
        ) : data ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Production</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.stats.totalProduction.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {data.stats.productionTrend > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                    )}
                    {Math.abs(data.stats.productionTrend).toFixed(1)}% from yesterday
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.stats.attendanceRate}%</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {data.stats.attendanceTrend > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                    )}
                    {Math.abs(data.stats.attendanceTrend).toFixed(1)}% from yesterday
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Operations</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.stats.activeFarms}</div>
                  <p className="text-xs text-muted-foreground">
                    farms, {data.stats.activeSheds} sheds
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.alerts.length}</div>
                  <p className="text-xs text-muted-foreground">
                    require attention
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            {data.alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Alerts</CardTitle>
                  <CardDescription>
                    Issues that require your attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.alerts.map((alert, index) => (
                      <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge 
                              variant={
                                alert.severity === 'high' ? 'destructive' : 
                                alert.severity === 'medium' ? 'default' : 'secondary'
                              }
                            >
                              {alert.severity}
                            </Badge>
                            <span className="text-sm font-medium capitalize">
                              {alert.type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                        </div>
                        <AlertTriangle className={`h-4 w-4 ml-3 ${
                          alert.severity === 'high' ? 'text-red-500' : 
                          alert.severity === 'medium' ? 'text-yellow-500' : 'text-gray-500'
                        }`} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProductionTrendChart 
                data={data.productionTrend}
                height={350}
              />
              
              <EggQualityChart 
                data={eggQualityData}
                height={350}
              />
              
              <ShedPerformanceChart 
                data={data.shedPerformance}
                height={350}
              />
              
              <AttendanceChart 
                data={data.attendanceSummary}
                height={350}
              />
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Sheds</CardTitle>
                  <CardDescription>
                    Highest production efficiency
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.shedPerformance.slice(0, 5).map((shed, index) => (
                      <div key={shed.shedId} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{shed.shedName}</p>
                          <p className="text-sm text-gray-500">{shed.farmName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{shed.efficiency.toFixed(1)}%</p>
                          <p className="text-sm text-gray-500">
                            {shed.totalProduction.toLocaleString()} eggs
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance Leaders</CardTitle>
                  <CardDescription>
                    Most consistent workers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.attendanceSummary.slice(0, 5).map((worker, index) => (
                      <div key={worker.userId} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{worker.userName}</p>
                          <p className="text-sm text-gray-500">
                            {worker.presentDays + worker.lateDays}/{worker.totalDays} days
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{worker.attendanceRate.toFixed(1)}%</p>
                          <Badge variant={worker.attendanceRate >= 95 ? "default" : worker.attendanceRate >= 85 ? "secondary" : "destructive"}>
                            {worker.attendanceRate >= 95 ? "Excellent" : worker.attendanceRate >= 85 ? "Good" : "Needs Improvement"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-gray-500">No analytics data available</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}