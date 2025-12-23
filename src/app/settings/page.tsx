"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  User, 
  Building2, 
  Bell, 
  Shield, 
  Save,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "sonner"
import DashboardLayout from "@/components/layout/dashboard-layout"

interface Organization {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  website?: string
  description?: string
}

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  avatar?: string
}

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  productionAlerts: boolean
  attendanceAlerts: boolean
  lowProductionThreshold: number
  attendanceThreshold: number
}

interface SystemSettings {
  timezone: string
  dateFormat: string
  currency: string
  language: string
  theme: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // State for different settings sections
  const [organization, setOrganization] = useState<Organization>({
    id: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    description: ""
  })
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: "",
    name: "",
    email: "",
    role: "",
    phone: "",
    avatar: ""
  })
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    productionAlerts: true,
    attendanceAlerts: true,
    lowProductionThreshold: 80,
    attendanceThreshold: 85
  })
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
    language: "en",
    theme: "light"
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // Fetch organization settings
      const orgResponse = await fetch("/api/organization")
      if (orgResponse.ok) {
        const orgData = await orgResponse.json()
        setOrganization(orgData.data || {})
      }

      // Fetch user profile
      const userResponse = await fetch("/api/profile")
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUserProfile(userData.data || {})
      }

      // Fetch notification settings
      const notifResponse = await fetch("/api/settings/notifications")
      if (notifResponse.ok) {
        const notifData = await notifResponse.json()
        setNotifications({ ...notifications, ...notifData.data })
      }

      // Fetch system settings
      const systemResponse = await fetch("/api/settings/system")
      if (systemResponse.ok) {
        const systemData = await systemResponse.json()
        setSystemSettings({ ...systemSettings, ...systemData.data })
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveOrganization = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(organization)
      })

      if (response.ok) {
        toast.success("Organization settings updated successfully")
      } else {
        toast.error("Failed to update organization settings")
      }
    } catch (error) {
      toast.error("Error updating organization settings")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userProfile)
      })

      if (response.ok) {
        toast.success("Profile updated successfully")
      } else {
        toast.error("Failed to update profile")
      }
    } catch (error) {
      toast.error("Error updating profile")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      if (response.ok) {
        toast.success("Password changed successfully")
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to change password")
      }
    } catch (error) {
      toast.error("Error changing password")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifications)
      })

      if (response.ok) {
        toast.success("Notification settings updated successfully")
      } else {
        toast.error("Failed to update notification settings")
      }
    } catch (error) {
      toast.error("Error updating notification settings")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSystemSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/settings/system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(systemSettings)
      })

      if (response.ok) {
        toast.success("System settings updated successfully")
      } else {
        toast.error("Failed to update system settings")
      }
    } catch (error) {
      toast.error("Error updating system settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Loading settings...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Please sign in to access settings.</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and system preferences</p>
        </div>

        <Tabs defaultValue="organization" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Organization Settings */}
          <TabsContent value="organization">
            <Card>
              <CardHeader>
                <CardTitle>Organization Information</CardTitle>
                <CardDescription>
                  Update your organization's basic information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={organization.name}
                      onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
                      placeholder="Enter organization name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgEmail">Email</Label>
                    <Input
                      id="orgEmail"
                      type="email"
                      value={organization.email || ""}
                      onChange={(e) => setOrganization({ ...organization, email: e.target.value })}
                      placeholder="organization@example.com"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="orgPhone">Phone</Label>
                    <Input
                      id="orgPhone"
                      value={organization.phone || ""}
                      onChange={(e) => setOrganization({ ...organization, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgWebsite">Website</Label>
                    <Input
                      id="orgWebsite"
                      value={organization.website || ""}
                      onChange={(e) => setOrganization({ ...organization, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="orgAddress">Address</Label>
                  <Textarea
                    id="orgAddress"
                    value={organization.address || ""}
                    onChange={(e) => setOrganization({ ...organization, address: e.target.value })}
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="orgDescription">Description</Label>
                  <Textarea
                    id="orgDescription"
                    value={organization.description || ""}
                    onChange={(e) => setOrganization({ ...organization, description: e.target.value })}
                    placeholder="Brief description of your organization"
                    rows={4}
                  />
                </div>

                <Button onClick={handleSaveOrganization} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-8 w-8 text-gray-500" />
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG or GIF. Max size 2MB.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="userName">Full Name</Label>
                    <Input
                      id="userName"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="userEmail">Email</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="userPhone">Phone</Label>
                    <Input
                      id="userPhone"
                      value={userProfile.phone || ""}
                      onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="userRole">Role</Label>
                    <div className="flex items-center h-10">
                      <Badge variant="outline" className="capitalize">
                        {userProfile.role?.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotif">Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="emailNotif"
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, emailNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="smsNotif">SMS Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                    </div>
                    <Switch
                      id="smsNotif"
                      checked={notifications.smsNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, smsNotifications: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="prodAlerts">Production Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified about production issues</p>
                    </div>
                    <Switch
                      id="prodAlerts"
                      checked={notifications.productionAlerts}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, productionAlerts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="attendAlerts">Attendance Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified about attendance issues</p>
                    </div>
                    <Switch
                      id="attendAlerts"
                      checked={notifications.attendanceAlerts}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, attendanceAlerts: checked })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Alert Thresholds</h4>
                  
                  <div>
                    <Label htmlFor="prodThreshold">Low Production Threshold (%)</Label>
                    <Input
                      id="prodThreshold"
                      type="number"
                      min="0"
                      max="100"
                      value={notifications.lowProductionThreshold}
                      onChange={(e) => 
                        setNotifications({ 
                          ...notifications, 
                          lowProductionThreshold: parseInt(e.target.value) || 0 
                        })
                      }
                      className="w-32"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Alert when production falls below this percentage
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="attendThreshold">Attendance Threshold (%)</Label>
                    <Input
                      id="attendThreshold"
                      type="number"
                      min="0"
                      max="100"
                      value={notifications.attendanceThreshold}
                      onChange={(e) => 
                        setNotifications({ 
                          ...notifications, 
                          attendanceThreshold: parseInt(e.target.value) || 0 
                        })
                      }
                      className="w-32"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Alert when attendance falls below this percentage
                    </p>
                  </div>
                </div>

                <Button onClick={handleSaveNotifications} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => 
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => 
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => 
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button onClick={handleChangePassword} disabled={saving}>
                    <Shield className="mr-2 h-4 w-4" />
                    {saving ? "Changing..." : "Change Password"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Information</CardTitle>
                  <CardDescription>
                    Your account security details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                    <Badge variant="outline">Not Enabled</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Last Password Change</p>
                      <p className="text-sm text-gray-500">Keep your password updated</p>
                    </div>
                    <span className="text-sm text-gray-500">30 days ago</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Preferences</CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={systemSettings.timezone}
                      onValueChange={(value) => 
                        setSystemSettings({ ...systemSettings, timezone: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select
                      value={systemSettings.dateFormat}
                      onValueChange={(value) => 
                        setSystemSettings({ ...systemSettings, dateFormat: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={systemSettings.currency}
                      onValueChange={(value) => 
                        setSystemSettings({ ...systemSettings, currency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={systemSettings.language}
                      onValueChange={(value) => 
                        setSystemSettings({ ...systemSettings, language: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={systemSettings.theme}
                    onValueChange={(value) => 
                      setSystemSettings({ ...systemSettings, theme: value })
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSaveSystemSettings} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}    