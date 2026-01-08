"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { useDashboardStats, useWeekStatus } from "@/hooks/use-dashboard"
import { 
  Egg, 
  Users, 
  Building2, 
  TrendingUp, 
  Calendar,
  AlertTriangle
} from "lucide-react"

export default function DashboardPage() {
  const { data: session } = useSession()
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardStats()
  const { data: weekStatus, isLoading: isWeekLoading } = useWeekStatus()

  if (!session?.user) {
    return null
  }

  const stats = dashboardData?.stats || {
    totalProduction: 0,
    todayProduction: 0,
    todayNormalEggs: 0,
    attendanceRate: 0,
    activeFarms: 0,
    activeSheds: 0,
    totalWorkers: 0,
    presentWorkers: 0,
  }

  const flockData = dashboardData?.flockData || {
    openingFemale: 0,
    openingMale: 0,
    mortalityF: 0,
    mortalityM: 0,
    closingFemale: 0,
    closingMale: 0,
  }

  const recentActivity = dashboardData?.recentActivity || []

  const weekData = weekStatus || {
    currentWeek: 1,
    dayOfWeek: 1,
    dayName: 'Monday',
    totalDays: 1,
    weeksRemaining: 72,
  }

  const loading = isDashboardLoading || isWeekLoading

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {session.user.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening at {session.user.organizationName} today.
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {session.user.role}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Normal Eggs</CardTitle>
              <Egg className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.todayNormalEggs.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.todayProduction === 0 ? "No production recorded today" : "Normal eggs collected today"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Eggs (Normal + HD)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.todayProduction.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total eggs (Normal + HD eggs)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : `${stats.attendanceRate}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalWorkers > 0 
                  ? `${stats.totalWorkers - stats.presentWorkers} absent today`
                  : "No workers registered"
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Farms</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.activeFarms}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.activeSheds} sheds total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.totalWorkers}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.activeFarms > 0 ? "Across all farms" : "No workers registered"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.activeFarms === 0 ? "1" : "0"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.activeFarms === 0 ? "Set up your first farm" : "All systems normal"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Flock Management & Production Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Flock Management</CardTitle>
              <CardDescription>
                Current flock status and age tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Age (Weeks)</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {loading ? "..." : weekData.currentWeek}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Age (Day of Week)</div>
                    <div className="text-2xl font-bold text-green-600">
                      {loading ? "..." : weekData.dayOfWeek}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Day Name</div>
                    <div className="text-lg font-semibold text-indigo-600">
                      {loading ? "..." : weekData.dayName}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Total Days</div>
                    <div className="text-lg font-semibold text-cyan-600">
                      {loading ? "..." : weekData.totalDays.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Opening Female</div>
                    <div className="text-lg font-semibold text-pink-600">
                      {loading ? "..." : flockData.openingFemale.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Opening Male</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {loading ? "..." : flockData.openingMale.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Mortality F</div>
                    <div className="text-lg font-semibold text-red-600">
                      {loading ? "..." : flockData.mortalityF}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Mortality M</div>
                    <div className="text-lg font-semibold text-red-600">
                      {loading ? "..." : flockData.mortalityM}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Closing Female</div>
                    <div className="text-lg font-semibold text-pink-500">
                      {loading ? "..." : flockData.closingFemale.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Closing Male</div>
                    <div className="text-lg font-semibold text-blue-500">
                      {loading ? "..." : flockData.closingMale.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions and updates in your system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                ) : recentActivity.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent activity</p>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="text-sm font-medium">{activity.action}</div>
                        <div className="text-xs text-gray-500">{activity.details}</div>
                      </div>
                      <div className="text-xs text-gray-400">{activity.time}</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you might want to perform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button 
                className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => window.location.href = '/production'}
              >
                <Egg className="h-6 w-6 text-blue-500 mb-2" />
                <div className="text-sm font-medium">Record Production</div>
                <div className="text-xs text-gray-500">Add today's egg count</div>
              </button>
              <button 
                className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => window.location.href = '/attendance'}
              >
                <Calendar className="h-6 w-6 text-green-500 mb-2" />
                <div className="text-sm font-medium">Mark Attendance</div>
                <div className="text-xs text-gray-500">Record worker attendance</div>
              </button>
              <button 
                className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => window.location.href = '/farms'}
              >
                <Building2 className="h-6 w-6 text-purple-500 mb-2" />
                <div className="text-sm font-medium">Manage Farms</div>
                <div className="text-xs text-gray-500">Add or edit farms</div>
              </button>
              <button 
                className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => window.location.href = '/production-cycles'}
              >
                <TrendingUp className="h-6 w-6 text-orange-500 mb-2" />
                <div className="text-sm font-medium">Production Cycles</div>
                <div className="text-xs text-gray-500">Manage week tracking</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}