"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Warehouse, Building2 } from "lucide-react"
import { toast } from "sonner"
import DashboardLayout from "@/components/layout/dashboard-layout"

interface Shed {
  id: string
  name: string
  capacity: number
  currentBirds: number
  description?: string
  isActive: boolean
  farm: {
    id: string
    name: string
  }
  createdAt: string
}

interface Farm {
  id: string
  name: string
}

export default function ShedsPage() {
  const [sheds, setSheds] = useState<Shed[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
    description: "",
    farmId: "",
  })

  useEffect(() => {
    fetchSheds()
    fetchFarms()
  }, [])

  const fetchSheds = async () => {
    try {
      const response = await fetch("/api/sheds")
      if (response.ok) {
        const data = await response.json()
        setSheds(data.data || [])
      } else {
        toast.error("Failed to fetch sheds")
      }
    } catch (error) {
      toast.error("Error fetching sheds")
    } finally {
      setLoading(false)
    }
  }

  const fetchFarms = async () => {
    try {
      const response = await fetch("/api/farms")
      if (response.ok) {
        const data = await response.json()
        setFarms(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching farms:", error)
    }
  }

  const handleCreateShed = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/sheds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          capacity: parseInt(formData.capacity),
        }),
      })

      if (response.ok) {
        toast.success("Shed created successfully")
        setIsCreateDialogOpen(false)
        setFormData({ name: "", capacity: "", description: "", farmId: "" })
        fetchSheds()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create shed")
      }
    } catch (error) {
      toast.error("Error creating shed")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shed Management</h1>
            <p className="text-gray-600">Manage poultry sheds and their capacity</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Shed
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Shed</DialogTitle>
                <DialogDescription>
                  Add a new shed to your farm
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateShed}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Shed Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="farmId">Farm</Label>
                    <Select value={formData.farmId} onValueChange={(value) => setFormData({ ...formData, farmId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a farm" />
                      </SelectTrigger>
                      <SelectContent>
                        {farms.map((farm) => (
                          <SelectItem key={farm.id} value={farm.id}>
                            {farm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity (birds)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Shed</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-8">Loading sheds...</div>
        ) : sheds.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Warehouse className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sheds</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new shed.</p>
          </div>
        ) : (
          sheds.map((shed) => (
            <Card key={shed.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Warehouse className="mr-2 h-5 w-5" />
                    {shed.name}
                  </span>
                  <Badge variant={shed.isActive ? "default" : "secondary"}>
                    {shed.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center">
                  <Building2 className="mr-1 h-4 w-4" />
                  {shed.farm.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Capacity:</span>
                    <span className="font-medium">{shed.capacity.toLocaleString()} birds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current:</span>
                    <span className="font-medium">{shed.currentBirds?.toLocaleString() || 0} birds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Utilization:</span>
                    <span className="font-medium">
                      {shed.capacity > 0 ? Math.round(((shed.currentBirds || 0) / shed.capacity) * 100) : 0}%
                    </span>
                  </div>
                  {shed.description && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-600">{shed.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </div>
    </DashboardLayout>
  )
}