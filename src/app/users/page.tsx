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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, UserPlus, Users as UsersIcon, AlertTriangle, Briefcase, DollarSign } from "lucide-react"
import { toast } from "sonner"
import DashboardLayout from "@/components/layout/dashboard-layout"

interface User {
  id: string
  name: string
  role: string
  isActive: boolean
  sex?: string
  phoneNumber?: string
  address?: string
  aadharNumber?: string
  referral?: string
  alternateContact?: string
  notes?: string
  supervisorId?: string
  jobRoleId?: string
  supervisor?: {
    id: string
    name: string
  }
  jobRole?: {
    id: string
    title: string
    salary: number
    salaryType: string
  }
  createdAt: string
}

interface JobRole {
  id: string
  title: string
  description?: string
  salary: number
  salaryType: string
  isActive: boolean
}

interface Manager {
  id: string
  name: string
}

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [jobRoles, setJobRoles] = useState<JobRole[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("users")
  
  // Dialog states
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isCreateJobRoleDialogOpen, setIsCreateJobRoleDialogOpen] = useState(false)
  const [isEditJobRoleDialogOpen, setIsEditJobRoleDialogOpen] = useState(false)
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedJobRole, setSelectedJobRole] = useState<JobRole | null>(null)
  
  // Form states
  const [userForm, setUserForm] = useState({
    name: "",
    role: "WORKER",
    password: "",
    sex: "",
    phoneNumber: "",
    address: "",
    aadharNumber: "",
    referral: "",
    alternateContact: "",
    supervisorId: "",
    jobRoleId: "",
    notes: "",
    isActive: true
  })

  const [jobRoleForm, setJobRoleForm] = useState({
    title: "",
    description: "",
    salary: "",
    salaryType: "MONTHLY"
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchUsers(),
        fetchJobRoles(),
        fetchManagers()
      ])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const result = await response.json()
        const userData = Array.isArray(result) ? result : (result.data || [])
        setUsers(userData)
      } else {
        toast.error("Failed to fetch users")
        setUsers([])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Error fetching users")
      setUsers([])
    }
  }

  const fetchJobRoles = async () => {
    try {
      const response = await fetch("/api/job-roles")
      if (response.ok) {
        const result = await response.json()
        const jobRoleData = Array.isArray(result) ? result : (result.data || [])
        setJobRoles(jobRoleData)
      }
    } catch (error) {
      console.error("Error fetching job roles:", error)
    }
  }

  const fetchManagers = async () => {
    try {
      const response = await fetch("/api/users?role=MANAGER,OWNER")
      if (response.ok) {
        const result = await response.json()
        const managerData = Array.isArray(result) ? result : (result.data || [])
        setManagers(managerData)
      }
    } catch (error) {
      console.error("Error fetching managers:", error)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (userForm.password.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm)
      })

      if (response.ok) {
        toast.success("User created successfully")
        setIsCreateUserDialogOpen(false)
        resetUserForm()
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create user")
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast.error("Error creating user")
    }
  }

  const handleCreateJobRole = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!jobRoleForm.title || !jobRoleForm.salary) {
      toast.error("Title and salary are required")
      return
    }

    try {
      const response = await fetch("/api/job-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobRoleForm)
      })

      if (response.ok) {
        toast.success("Job role created successfully")
        setIsCreateJobRoleDialogOpen(false)
        resetJobRoleForm()
        fetchJobRoles()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create job role")
      }
    } catch (error) {
      console.error("Error creating job role:", error)
      toast.error("Error creating job role")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("User deleted successfully")
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Error deleting user")
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm)
      })

      if (response.ok) {
        toast.success("User updated successfully")
        setIsEditUserDialogOpen(false)
        setSelectedUser(null)
        resetUserForm()
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update user")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Error updating user")
    }
  }

  const openEditUserDialog = (user: User) => {
    setSelectedUser(user)
    setUserForm({
      name: user.name || "",
      role: user.role,
      password: "", // Don't populate password for security
      sex: user.sex || "",
      phoneNumber: user.phoneNumber || "",
      address: user.address || "",
      aadharNumber: user.aadharNumber || "",
      referral: user.referral || "",
      alternateContact: user.alternateContact || "",
      supervisorId: user.supervisorId || "",
      jobRoleId: user.jobRoleId || "",
      notes: user.notes || "",
      isActive: user.isActive
    })
    setIsEditUserDialogOpen(true)
  }

  const handleDeleteJobRole = async (jobRoleId: string) => {
    if (!confirm("Are you sure you want to delete this job role? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/job-roles/${jobRoleId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Job role deleted successfully")
        fetchJobRoles()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete job role")
      }
    } catch (error) {
      console.error("Error deleting job role:", error)
      toast.error("Error deleting job role")
    }
  }

  const resetUserForm = () => {
    setUserForm({
      name: "",
      role: "WORKER",
      password: "",
      sex: "",
      phoneNumber: "",
      address: "",
      aadharNumber: "",
      referral: "",
      alternateContact: "",
      supervisorId: "",
      jobRoleId: "",
      notes: "",
      isActive: true
    })
  }

  const resetJobRoleForm = () => {
    setJobRoleForm({
      title: "",
      description: "",
      salary: "",
      salaryType: "MONTHLY"
    })
  }

  const getSelectedJobRole = () => {
    if (!userForm.jobRoleId) return null
    return jobRoles.find(role => role.id === userForm.jobRoleId)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "OWNER": return "bg-purple-100 text-purple-800"
      case "MANAGER": return "bg-blue-100 text-blue-800"
      case "WORKER": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatSalary = (salary: number, salaryType: string) => {
    return `₹${salary.toLocaleString()} / ${salaryType.toLowerCase()}`
  }

  // Check if user is OWNER
  if (session?.user?.role !== "OWNER") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-600">Only organization owners can manage users.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const safeUsers = Array.isArray(users) ? users : []
  const safeJobRoles = Array.isArray(jobRoles) ? jobRoles : []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">Manage organization users, job roles, and permissions</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="job-roles">Job Roles</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Users ({safeUsers.length})</h2>
              <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to your organization
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="name"
                          value={userForm.name}
                          onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                          placeholder="Enter full name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sex">Sex</Label>
                        <Select value={userForm.sex} onValueChange={(value) => setUserForm({ ...userForm, sex: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sex" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Male</SelectItem>
                            <SelectItem value="F">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                        <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WORKER">Worker</SelectItem>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="OWNER">Owner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                        <Input
                          id="password"
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          placeholder="Minimum 6 characters"
                          minLength={6}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={userForm.phoneNumber}
                          onChange={(e) => setUserForm({ ...userForm, phoneNumber: e.target.value })}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alternateContact">Alternative Contact</Label>
                        <Input
                          id="alternateContact"
                          type="tel"
                          value={userForm.alternateContact}
                          onChange={(e) => setUserForm({ ...userForm, alternateContact: e.target.value })}
                          placeholder="Alternative contact number"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={userForm.address}
                        onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                        placeholder="Enter full address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="aadharNumber">Aadhar Number</Label>
                        <Input
                          id="aadharNumber"
                          value={userForm.aadharNumber}
                          onChange={(e) => setUserForm({ ...userForm, aadharNumber: e.target.value })}
                          placeholder="12-digit Aadhar number"
                          maxLength={12}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="referral">Referral</Label>
                        <Input
                          id="referral"
                          value={userForm.referral}
                          onChange={(e) => setUserForm({ ...userForm, referral: e.target.value })}
                          placeholder="Referral information"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="supervisor">Supervisor/Manager</Label>
                        <Select value={userForm.supervisorId} onValueChange={(value) => setUserForm({ ...userForm, supervisorId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supervisor" />
                          </SelectTrigger>
                          <SelectContent>
                            {managers.filter(manager => manager.id && manager.id.trim() !== '').map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jobRole">Job Role</Label>
                        <Select value={userForm.jobRoleId} onValueChange={(value) => setUserForm({ ...userForm, jobRoleId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job role" />
                          </SelectTrigger>
                          <SelectContent>
                            {safeJobRoles.filter(role => role.id && role.id.trim() !== '').map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.title} - {formatSalary(role.salary, role.salaryType)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {getSelectedJobRole() && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Selected Job: {getSelectedJobRole()?.title}
                          </span>
                        </div>
                        <div className="text-lg font-bold text-green-600 mt-1">
                          Salary: {formatSalary(getSelectedJobRole()!.salary, getSelectedJobRole()!.salaryType)}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes/Others</Label>
                      <Textarea
                        id="notes"
                        value={userForm.notes}
                        onChange={(e) => setUserForm({ ...userForm, notes: e.target.value })}
                        placeholder="Additional notes or information..."
                        rows={3}
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create User</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading users...</p>
                  </div>
                ) : safeUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
                    <div className="mt-6">
                      <Button onClick={() => setIsCreateUserDialogOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add User
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Job Role</TableHead>
                          <TableHead>Supervisor</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {safeUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                {user.sex && (
                                  <div className="text-sm text-gray-500">
                                    {user.sex === 'M' ? 'Male' : 'Female'}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.jobRole ? (
                                <div>
                                  <div className="font-medium">{user.jobRole.title}</div>
                                  <div className="text-sm text-gray-500">
                                    {formatSalary(user.jobRole.salary, user.jobRole.salaryType)}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">No job role</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.supervisor ? (
                                <span className="text-sm">{user.supervisor.name}</span>
                              ) : (
                                <span className="text-gray-400">No supervisor</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {user.phoneNumber && <div>{user.phoneNumber}</div>}
                                {user.alternateContact && <div className="text-gray-500">{user.alternateContact}</div>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.isActive ? "default" : "secondary"}>
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openEditUserDialog(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={user.id === session?.user?.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>   
       {/* Job Roles Tab */}
          <TabsContent value="job-roles" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Job Roles ({safeJobRoles.length})</h2>
              <Dialog open={isCreateJobRoleDialogOpen} onOpenChange={setIsCreateJobRoleDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Add Job Role
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Job Role</DialogTitle>
                    <DialogDescription>
                      Define a new job role with salary information
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateJobRole} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title <span className="text-red-500">*</span></Label>
                      <Input
                        id="jobTitle"
                        value={jobRoleForm.title}
                        onChange={(e) => setJobRoleForm({ ...jobRoleForm, title: e.target.value })}
                        placeholder="e.g., Cleaner, Feeder, Supervisor"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jobDescription">Job Description</Label>
                      <Textarea
                        id="jobDescription"
                        value={jobRoleForm.description}
                        onChange={(e) => setJobRoleForm({ ...jobRoleForm, description: e.target.value })}
                        placeholder="Describe the job responsibilities..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salary">Salary <span className="text-red-500">*</span></Label>
                        <Input
                          id="salary"
                          type="number"
                          min="0"
                          step="0.01"
                          value={jobRoleForm.salary}
                          onChange={(e) => setJobRoleForm({ ...jobRoleForm, salary: e.target.value })}
                          placeholder="Enter salary amount"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salaryType">Salary Type</Label>
                        <Select value={jobRoleForm.salaryType} onValueChange={(value) => setJobRoleForm({ ...jobRoleForm, salaryType: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HOURLY">Hourly</SelectItem>
                            <SelectItem value="DAILY">Daily</SelectItem>
                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="YEARLY">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {jobRoleForm.salary && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Salary Preview</span>
                        </div>
                        <div className="text-lg font-bold text-blue-600 mt-1">
                          ₹{parseFloat(jobRoleForm.salary || "0").toLocaleString()} / {jobRoleForm.salaryType.toLowerCase()}
                        </div>
                      </div>
                    )}

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateJobRoleDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create Job Role</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading job roles...</p>
                  </div>
                ) : safeJobRoles.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No job roles found</h3>
                    <p className="mt-1 text-sm text-gray-500">Create job roles to assign to your workers.</p>
                    <div className="mt-6">
                      <Button onClick={() => setIsCreateJobRoleDialogOpen(true)}>
                        <Briefcase className="mr-2 h-4 w-4" />
                        Add Job Role
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {safeJobRoles.map((jobRole) => (
                      <Card key={jobRole.id} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{jobRole.title}</CardTitle>
                            <div className="flex space-x-1">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteJobRole(jobRole.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-semibold text-green-600">
                                {formatSalary(jobRole.salary, jobRole.salaryType)}
                              </span>
                            </div>
                            
                            {jobRole.description && (
                              <p className="text-sm text-gray-600 line-clamp-3">
                                {jobRole.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between pt-2">
                              <Badge variant={jobRole.isActive ? "default" : "secondary"}>
                                {jobRole.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {users.filter(user => user.jobRoleId === jobRole.id).length} assigned
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and settings
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-name"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sex">Sex</Label>
                  <Select value={userForm.sex} onValueChange={(value) => setUserForm({ ...userForm, sex: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role <span className="text-red-500">*</span></Label>
                  <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WORKER">Worker</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="OWNER">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">New Password (Optional)</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Leave blank to keep current password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                  <Input
                    id="edit-phoneNumber"
                    type="tel"
                    value={userForm.phoneNumber}
                    onChange={(e) => setUserForm({ ...userForm, phoneNumber: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-alternateContact">Alternative Contact</Label>
                  <Input
                    id="edit-alternateContact"
                    type="tel"
                    value={userForm.alternateContact}
                    onChange={(e) => setUserForm({ ...userForm, alternateContact: e.target.value })}
                    placeholder="Alternative contact number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={userForm.address}
                  onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                  placeholder="Enter full address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-aadharNumber">Aadhar Number</Label>
                  <Input
                    id="edit-aadharNumber"
                    value={userForm.aadharNumber}
                    onChange={(e) => setUserForm({ ...userForm, aadharNumber: e.target.value })}
                    placeholder="12-digit Aadhar number"
                    maxLength={12}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-referral">Referral</Label>
                  <Input
                    id="edit-referral"
                    value={userForm.referral}
                    onChange={(e) => setUserForm({ ...userForm, referral: e.target.value })}
                    placeholder="Referral information"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-supervisor">Supervisor/Manager</Label>
                  <Select value={userForm.supervisorId} onValueChange={(value) => setUserForm({ ...userForm, supervisorId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.filter(manager => manager.id && manager.id.trim() !== '').map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-jobRole">Job Role</Label>
                  <Select value={userForm.jobRoleId} onValueChange={(value) => setUserForm({ ...userForm, jobRoleId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job role" />
                    </SelectTrigger>
                    <SelectContent>
                      {safeJobRoles.filter(role => role.id && role.id.trim() !== '').map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.title} - {formatSalary(role.salary, role.salaryType)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {getSelectedJobRole() && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Selected Job: {getSelectedJobRole()?.title}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-green-600 mt-1">
                    Salary: {formatSalary(getSelectedJobRole()!.salary, getSelectedJobRole()!.salaryType)}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes/Others</Label>
                <Textarea
                  id="edit-notes"
                  value={userForm.notes}
                  onChange={(e) => setUserForm({ ...userForm, notes: e.target.value })}
                  placeholder="Additional notes or information..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={userForm.isActive}
                  onCheckedChange={(checked) => setUserForm({ ...userForm, isActive: checked })}
                />
                <Label htmlFor="edit-active">Active User</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update User</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}