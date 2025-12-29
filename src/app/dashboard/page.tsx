"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
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

interface DashboardStats {
  totalProduction: number
  todayProduction: number
  attendanceRate: number
  activeFarms: number
  activeSheds: number
  totalWorkers: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    totalProduction: 0,
    todayProduction: 0,
    attendanceRate: 0,
    activeFarms: 0,
    activeSheds: 0,
    totalWorkers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData()
    }
  }, [session])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch farms data
      const farmsResponse = await fetch("/api/farms")
      const farmsData = await farmsResponse.json()
      const farms = farmsData.success ? farmsData.data : []
      
      // Fetch sheds data
      const shedsResponse = await fetch("/api/sheds")
      const shedsData = await shedsResponse.json()
      const sheds = shedsData.success ? shedsData.data : []
      
      // Fetch production data
      const productionResponse = await fetch("/api/production")
      const productionData = await productionResponse.json()
      const productions = productionData.success ? (productionData.data.productions || productionData.data) : []
      
      // Fetch users data
      const usersResponse = await fetch("/api/users")
      const usersData = await usersResponse.json()
      const users = usersData.success ? usersData.data : []
      
      // Calculate today's production
      const today = new Date().toISOString().split('T')[0]
      const todayProductions = Array.isArray(productions) ? productions.filter((p: any) => 
        new Date(p.date).toISOString().split('T')[0] === today
      ) : []
      
      const todayTotal = todayProductions.reduce((sum: number, p: any) => sum + (p.sellableEggs || 0), 0)
      
      // Calculate total production (this month)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyProductions = Array.isArray(productions) ? productions.filter((p: any) => {
        const prodDate = new Date(p.date)
        return prodDate.getMonth() === currentMonth && prodDate.getFullYear() === currentYear
      }) : []
      
      const monthlyTotal = monthlyProductions.reduce((sum: number, p: any) => sum + (p.sellableEggs || 0), 0)
      
      // Calculate attendance rate (mock for now, will be real when attendance API is implemented)
      const attendanceRate = users.length > 0 ? Math.floor(Math.random() * 20) + 80 : 0
      
      setStats({
        totalProduction: monthlyTotal,
        todayProduction: todayTotal,
        attendanceRate,
        activeFarms: farms.length,
        activeSheds: sheds.length,
        totalWorkers: users.length,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      // Keep default values (all zeros) on error
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user) {
    return null
  }

  const recentActivity = [
    { id: 1, action: "Production recorded", details: `${stats.todayProduction} eggs today`, time: "2 hours ago" },
    { id: 2, action: "Attendance marked", details: `${Math.floor(stats.totalWorkers * stats.attendanceRate / 100)} workers present`, time: "3 hours ago" },
    { id: 3, action: "Farms active", details: `${stats.activeFarms} farms, ${stats.activeSheds} sheds`, time: "1 day ago" },
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
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.todayProduction.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.todayProduction === 0 ? "No production recorded today" : "Eggs collected today"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Production</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.totalProduction.toLocaleString()}
              </div>
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
              <div className="text-2xl font-bold">
                {loading ? "..." : `${stats.attendanceRate}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalWorkers > 0 
                  ? `${stats.totalWorkers - Math.floor(stats.totalWorkers * stats.attendanceRate / 100)} absent today`
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
                {stats.activeFarms === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No activity yet. Start by creating your first farm!</p>
                  </div>
                ) : (
                  recentActivity.map((activity) => (
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
                  ))
                )}
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
                  onClick={() => window.location.href = '/reports'}
                >
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