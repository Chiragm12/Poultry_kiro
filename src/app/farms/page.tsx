"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Plus, Building2, Users, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DashboardLayout from "@/components/layout/dashboard-layout"
import CreateFarmForm from "@/components/forms/create-farm-form"
import EditFarmForm from "@/components/forms/edit-farm-form"
import { toast } from "sonner"

interface Farm {
  id: string
  name: string
  location?: string
  description?: string
  isActive: boolean
  maleCount?: number
  femaleCount?: number
  manager?: {
    id: string
    name: string
    email: string
  }
  sheds: {
    id: string
    name: string
    capacity: number
    isActive: boolean
  }[]
  _count: {
    sheds: number
  }
  createdAt: string
  updatedAt: string
}

export default function FarmsPage() {
  const { data: session } = useSession()
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)

  const fetchFarms = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/farms")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch farms")
      }

      setFarms(result.data)
    } catch (error) {
      console.error("Error fetching farms:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch farms")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFarms()
  }, [])

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false)
    fetchFarms()
    toast.success("Farm created successfully")
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
    setSelectedFarm(null)
    fetchFarms()
    toast.success("Farm updated successfully")
  }

  const handleDelete = async (farm: Farm) => {
    if (!confirm(`Are you sure you want to delete "${farm.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/farms/${farm.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete farm")
      }

      fetchFarms()
      toast.success("Farm deleted successfully")
    } catch (error) {
      console.error("Error deleting farm:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete farm")
    }
  }

  if (!session?.user) {
    return null
  }

  const canManageFarms = session.user.role === "OWNER"

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Farms</h1>
            <p className="text-gray-600 mt-1">
              Manage your poultry farms and their details
            </p>
          </div>
          {canManageFarms && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Farm
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Farm</DialogTitle>
                  <DialogDescription>
                    Add a new farm to your organization
                  </DialogDescription>
                </DialogHeader>
                <CreateFarmForm onSuccess={handleCreateSuccess} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : farms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No farms found</h3>
              <p className="text-gray-500 text-center mb-4">
                Get started by creating your first farm
              </p>
              {canManageFarms && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Farm
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farms.map((farm) => (
              <Card key={farm.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{farm.name}</CardTitle>
                    {farm.location && (
                      <CardDescription>{farm.location}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={farm.isActive ? "default" : "secondary"}>
                      {farm.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {canManageFarms && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedFarm(farm)
                              setEditDialogOpen(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(farm)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {farm.description && (
                      <p className="text-sm text-gray-600">{farm.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-500">
                        <Users className="mr-1 h-4 w-4" />
                        Total Birds: {(farm.maleCount || 0) + (farm.femaleCount || 0)}
                      </div>
                      <div className="text-gray-500">
                        M: {farm.maleCount || 0} | F: {farm.femaleCount || 0}
                      </div>
                    </div>

                    {farm.manager && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="mr-1 h-4 w-4" />
                        Manager: {farm.manager.name}
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <div className="text-xs text-gray-400">
                        Created: {new Date(farm.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Farm Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Farm</DialogTitle>
              <DialogDescription>
                Update farm details
              </DialogDescription>
            </DialogHeader>
            {selectedFarm && (
              <EditFarmForm farm={selectedFarm} onSuccess={handleEditSuccess} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}