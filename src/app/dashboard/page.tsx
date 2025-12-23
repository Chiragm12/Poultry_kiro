"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import DashboardLayout from "@/components/layout/dashboard-layout"
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

  if (!session?.user) {
    return null
  }

  // Mock data - will be replaced with real data from API
  const stats = {
    totalProduction: 12450,
    todayProduction: 245,
    attendanceRate: 92,
    activeFarms: 3,
    activeSheds: 12,
    totalWorkers: 25,
  }

  const recentActivity = [
    { id: 1, action: "Production recorded", details: "Shed A1 - 245 eggs", time: "2 hours ago" },
    { id: 2, action: "Attendance marked", details: "15 workers present", time: "3 hours ago" },
    { id: 3, action: "New shed added", details: "Shed C3 - Capacity 500", time: "1 day ago" },
  ]

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
              <CardTitle className="text-sm font-medium">Today's Production</CardTitle>
              <Egg className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayProduction.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Production</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProduction.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalWorkers - Math.floor(stats.totalWorkers * stats.attendanceRate / 100)} absent today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Farms</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeFarms}</div>
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
              <div className="text-2xl font-bold">{stats.totalWorkers}</div>
              <p className="text-xs text-muted-foreground">
                Across all farms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates from your farm operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.details}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks you might want to perform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                  <Egg className="h-6 w-6 text-blue-500 mb-2" />
                  <div className="text-sm font-medium">Record Production</div>
                  <div className="text-xs text-gray-500">Add today's egg count</div>
                </button>
                <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                  <Calendar className="h-6 w-6 text-green-500 mb-2" />
                  <div className="text-sm font-medium">Mark Attendance</div>
                  <div className="text-xs text-gray-500">Record worker attendance</div>
                </button>
                <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                  <Building2 className="h-6 w-6 text-purple-500 mb-2" />
                  <div className="text-sm font-medium">Manage Farms</div>
                  <div className="text-xs text-gray-500">Add or edit farms</div>
                </button>
                <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                  <TrendingUp className="h-6 w-6 text-orange-500 mb-2" />
                  <div className="text-sm font-medium">View Reports</div>
                  <div className="text-xs text-gray-500">Generate analytics</div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}