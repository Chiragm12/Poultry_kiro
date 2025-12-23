"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Calendar, Users, CheckCircle, XCircle, Clock, Heart, Plane } from "lucide-react"
import { toast } from "sonner"
import DashboardLayout from "@/components/layout/dashboard-layout"

interface Attendance {
  id: string
  date: string
  status: string
  notes?: string
  user: {
    id: string
    name: string
    role: string
  }
  createdAt: string
}

interface User {
  id: string
  name: string
  role: string
}

const statusConfig = {
  PRESENT: { label: "Present", icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  ABSENT: { label: "Absent", icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
  LATE: { label: "Late", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100" },
  SICK_LEAVE: { label: "Sick Leave", icon: Heart, color: "text-blue-600", bg: "bg-blue-100" },
  VACATION: { label: "Vacation", icon: Plane, color: "text-purple-600", bg: "bg-purple-100" },
}

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    userId: "",
    status: "PRESENT",
    notes: "",
  })

  useEffect(() => {
    fetchAttendances()
    fetchUsers()
  }, [selectedDate])

  const fetchAttendances = async () => {
    try {
      const response = await fetch(`/api/attendance?date=${selectedDate}`)
      if (response.ok) {
        const result = await response.json()
        console.log('API Response:', result) // Debug log
        // The API returns { success: true, data: [...] }
        const attendanceData = Array.isArray(result.data) ? result.data : []
        setAttendances(attendanceData)
      } else {
        toast.error("Failed to fetch attendance records")
        setAttendances([]) // Set empty array on error
      }
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error("Error fetching attendance records")
      setAttendances([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleCreateAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that a staff member is selected
    if (!formData.userId) {
      toast.error("Please select a staff member")
      return
    }

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("Attendance recorded successfully")
        setIsCreateDialogOpen(false)
        setFormData({
          date: new Date().toISOString().split('T')[0],
          userId: "",
          status: "PRESENT",
          notes: "",
        })
        fetchAttendances()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to record attendance")
      }
    } catch (error) {
      console.error("Error recording attendance:", error)
      toast.error("Error recording attendance")
    }
  }

  const handleBulkAttendance = async (status: string) => {
    const safeAttendances = Array.isArray(attendances) ? attendances : []
    const usersWithoutAttendance = users.filter(user => 
      !safeAttendances.some(att => att.user.id === user.id)
    )

    if (usersWithoutAttendance.length === 0) {
      toast.info("All users already have attendance recorded for this date")
      return
    }

    try {
      const response = await fetch("/api/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          attendanceRecords: usersWithoutAttendance.map(user => ({
            userId: user.id,
            status,
            notes: `Bulk ${status.toLowerCase()} entry`,
          })),
        }),
      })

      if (response.ok) {
        toast.success(`Bulk ${status.toLowerCase()} recorded for ${usersWithoutAttendance.length} users`)
        fetchAttendances()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to record bulk attendance")
      }
    } catch (error) {
      toast.error("Error recording bulk attendance")
    }
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null

    const Icon = config.icon
    return (
      <Badge variant="outline" className={`${config.bg} ${config.color} border-current`}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // Ensure attendances is always an array
  const safeAttendances = Array.isArray(attendances) ? attendances : []

  const attendanceStats = {
    present: safeAttendances.filter(a => a.status === "PRESENT").length,
    absent: safeAttendances.filter(a => a.status === "ABSENT").length,
    late: safeAttendances.filter(a => a.status === "LATE").length,
    leave: safeAttendances.filter(a => ["SICK_LEAVE", "VACATION"].includes(a.status)).length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600">Track staff attendance and manage leave records</p>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Attendance
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Attendance</DialogTitle>
                  <DialogDescription>
                    Mark attendance for a staff member
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAttendance}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="userId">Staff Member <span className="text-red-500">*</span></Label>
                      <Select 
                        value={formData.userId} 
                        onValueChange={(value) => setFormData({ ...formData, userId: value })}
                        required
                      >
                        <SelectTrigger id="userId">
                          <SelectValue placeholder="Select a staff member" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">No staff members available</div>
                          ) : (
                            users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} - {user.role}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRESENT">Present</SelectItem>
                          <SelectItem value="ABSENT">Absent</SelectItem>
                          <SelectItem value="LATE">Late</SelectItem>
                          <SelectItem value="SICK_LEAVE">Sick Leave</SelectItem>
                          <SelectItem value="VACATION">Vacation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any additional notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!formData.userId}>
                      Record Attendance
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div>
            <Label htmlFor="dateFilter">Date</Label>
            <Input
              id="dateFilter"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAttendance("PRESENT")}
            >
              Mark All Present
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAttendance("ABSENT")}
            >
              Mark All Absent
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Late</p>
                  <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">On Leave</p>
                  <p className="text-2xl font-bold text-blue-600">{attendanceStats.leave}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Attendance Records - {selectedDate}
            </CardTitle>
            <CardDescription>
              Staff attendance for the selected date
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading attendance records...</div>
            ) : safeAttendances.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
                <p className="mt-1 text-sm text-gray-500">Start by recording attendance for today.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Recorded At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeAttendances.map((attendance) => (
                    <TableRow key={attendance.id}>
                      <TableCell className="font-medium">{attendance.user.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{attendance.user.role}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(attendance.status)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {attendance.notes || "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(attendance.createdAt).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}