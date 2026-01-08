"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Plus, Calendar, Edit, Trash2, AlertTriangle, CheckCircle, Clock, RotateCcw } from "lucide-react"
import { format } from "date-fns"
import { useProductionCycles, useCreateProductionCycle, useUpdateProductionCycle, useDeleteProductionCycle } from "@/hooks/use-production-cycles"
import { useFarms } from "@/hooks/use-farms"

export default function ProductionCyclesPage() {
  const { data: session } = useSession()
  const { data: cycles = [], isLoading: cyclesLoading } = useProductionCycles()
  const { data: farms = [], isLoading: farmsLoading } = useFarms()
  const createCycleMutation = useCreateProductionCycle()
  const updateCycleMutation = useUpdateProductionCycle()
  const deleteCycleMutation = useDeleteProductionCycle()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    startDate: new Date().toISOString().split('T')[0],
    startWeek: "1",
    expectedEndWeek: "72",
    farmId: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.farmId) {
      return
    }

    const data = {
      ...formData,
      startWeek: parseInt(formData.startWeek),
      expectedEndWeek: parseInt(formData.expectedEndWeek),
    }

    try {
      if (isEditMode && editingCycleId) {
        await updateCycleMutation.mutateAsync({ id: editingCycleId, data })
      } else {
        await createCycleMutation.mutateAsync(data)
      }
      
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      startDate: new Date().toISOString().split('T')[0],
      startWeek: "1",
      expectedEndWeek: "72",
      farmId: "",
    })
    setIsEditMode(false)
    setEditingCycleId(null)
  }

  const handleEdit = (cycle: any) => {
    setFormData({
      name: cycle.name,
      startDate: new Date(cycle.startDate).toISOString().split('T')[0],
      startWeek: cycle.startWeek.toString(),
      expectedEndWeek: cycle.expectedEndWeek.toString(),
      farmId: cycle.farmId,
    })
    setIsEditMode(true)
    setEditingCycleId(cycle.id)
    setIsDialogOpen(true)
  }

  const handleDelete = async (cycleId: string) => {
    if (!confirm("Are you sure you want to delete this production cycle?")) {
      return
    }

    try {
      await deleteCycleMutation.mutateAsync(cycleId)
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  }

  const handleActivate = async (cycleId: string) => {
    try {
      await updateCycleMutation.mutateAsync({ 
        id: cycleId, 
        data: { isActive: true } 
      })
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  }

  if (!session?.user) {
    return null
  }

  const canManageCycles = ["OWNER", "MANAGER"].includes(session.user.role)

  if (!canManageCycles) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to manage production cycles. Contact your administrator.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  const loading = cyclesLoading || farmsLoading
  const isSubmitting = createCycleMutation.isPending || updateCycleMutation.isPending

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production Cycles</h1>
            <p className="text-gray-600 mt-1">
              Manage production cycles and track week progression automatically
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Cycle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{isEditMode ? 'Edit Production Cycle' : 'Create New Production Cycle'}</DialogTitle>
                <DialogDescription>
                  {isEditMode ? 'Update the production cycle details' : 'Set up a new production cycle with automatic week tracking'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Cycle Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Batch 2024-01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="farm">Farm</Label>
                  <Select value={formData.farmId} onValueChange={(value) => setFormData({ ...formData, farmId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select farm" />
                    </SelectTrigger>
                    <SelectContent>
                      {farms.map((farm) => (
                        <SelectItem key={farm.id} value={farm.id}>
                          {farm.name} - {farm.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startWeek">Start Week</Label>
                    <Input
                      id="startWeek"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.startWeek}
                      onChange={(e) => setFormData({ ...formData, startWeek: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedEndWeek">Expected End Week</Label>
                  <Input
                    id="expectedEndWeek"
                    type="number"
                    min="1"
                    max="200"
                    value={formData.expectedEndWeek}
                    onChange={(e) => setFormData({ ...formData, expectedEndWeek: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Typical laying cycle is 72 weeks
                  </p>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Cycle' : 'Create Cycle')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Production Cycles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Production Cycles</CardTitle>
            <CardDescription>
              Manage your production cycles and track automatic week progression
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cycle Name</TableHead>
                  <TableHead>Farm</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Week Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading production cycles...
                    </TableCell>
                  </TableRow>
                ) : cycles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No production cycles found. Create your first cycle!
                    </TableCell>
                  </TableRow>
                ) : (
                  cycles.map((cycle) => (
                    <TableRow key={cycle.id}>
                      <TableCell>
                        <div className="font-medium">{cycle.name}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cycle.farm.name}</div>
                          <div className="text-sm text-gray-500">{cycle.farm.location}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(cycle.startDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          Week {cycle.startWeek} - {cycle.expectedEndWeek}
                        </div>
                        <div className="text-xs text-gray-500">
                          {cycle.expectedEndWeek - cycle.startWeek + 1} weeks total
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cycle.isActive ? "default" : "secondary"}>
                          {cycle.isActive ? (
                            <>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <Clock className="mr-1 h-3 w-3" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(cycle.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {!cycle.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivate(cycle.id)}
                              disabled={updateCycleMutation.isPending}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(cycle)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(cycle.id)}
                            disabled={deleteCycleMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}