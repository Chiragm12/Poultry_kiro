"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Egg, Calendar, Edit, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import DashboardLayout from "@/components/layout/dashboard-layout"

interface Production {
  id: string
  date: string
  totalEggs: number
  normalEggs: number
  commEggs: number
  waterEggs: number
  jellyEggs: number
  creakEggs: number
  leakerEggs: number
  // Backward compatibility fields
  jumboEggs?: number
  crackedEggs?: number
  brokenEggs?: number
  damagedEggs?: number
  sellableEggs: number
  notes?: string
  shed: {
    id: string
    name: string
    farm: {
      name: string
    }
  }
  createdAt: string
}

interface Shed {
  id: string
  name: string
  farm: {
    id: string
    name: string
  }
}

export default function ProductionPage() {
  const [productions, setProductions] = useState<Production[]>([])
  const [sheds, setSheds] = useState<Shed[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduction, setEditingProduction] = useState<Production | null>(null)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shedId: "",
    totalEggs: "",
    normalEggs: "",
    commEggs: "",
    waterEggs: "0",
    jellyEggs: "0",
    creakEggs: "0",
    leakerEggs: "0",
    notes: "",
  })

  const [editFormData, setEditFormData] = useState({
    totalEggs: "",
    normalEggs: "",
    commEggs: "",
    waterEggs: "",
    jellyEggs: "",
    creakEggs: "",
    leakerEggs: "",
    notes: "",
  })

  useEffect(() => {
    fetchProductions()
    fetchSheds()
  }, [])

  const fetchProductions = async () => {
    try {
      const response = await fetch("/api/production")
      if (response.ok) {
        const result = await response.json()

        if (result.success && result.data) {
          if (Array.isArray(result.data.productions)) {
            setProductions(result.data.productions)
          } else if (Array.isArray(result.data)) {
            setProductions(result.data)
          } else {
            console.error("Unexpected API response format:", result)
            setProductions([])
          }
        } else {
          console.error("API response missing success or data:", result)
          setProductions([])
        }
      } else {
        toast.error("Failed to fetch production records")
        setProductions([])
      }
    } catch (error) {
      console.error("Error fetching production records:", error)
      toast.error("Error fetching production records")
      setProductions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSheds = async () => {
    try {
      const response = await fetch("/api/sheds")
      if (response.ok) {
        const result = await response.json()

        if (result.success && result.data) {
          if (Array.isArray(result.data)) {
            setSheds(result.data)
          } else {
            console.error("Unexpected sheds API response format:", result)
            setSheds([])
          }
        } else {
          console.error("Sheds API response missing success or data:", result)
          setSheds([])
        }
      } else {
        console.error("Failed to fetch sheds, status:", response.status)
        toast.error("Failed to fetch sheds")
        setSheds([])
      }
    } catch (error) {
      console.error("Error fetching sheds:", error)
      toast.error("Error fetching sheds")
      setSheds([])
    }
  }

  const validateEggCounts = (data: any) => {
    const total = parseInt(data.totalEggs) || 0
    const normal = parseInt(data.normalEggs) || 0
    const comm = parseInt(data.commEggs) || 0
    const water = parseInt(data.waterEggs) || 0
    const jelly = parseInt(data.jellyEggs) || 0
    const creak = parseInt(data.creakEggs) || 0
    const leaker = parseInt(data.leakerEggs) || 0
    
    const categorizedTotal = normal + comm + water + jelly + creak + leaker
    
    if (categorizedTotal > total) {
      toast.error(`Total categorized eggs (${categorizedTotal}) cannot exceed total eggs (${total})`)
      return false
    }
    
    return true
  }

  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.shedId) {
      toast.error("Please select a shed")
      return
    }

    if (!formData.totalEggs || parseInt(formData.totalEggs) < 0) {
      toast.error("Please enter a valid total eggs count")
      return
    }

    if (!validateEggCounts(formData)) {
      return
    }

    try {
      const response = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalEggs: parseInt(formData.totalEggs),
          normalEggs: parseInt(formData.normalEggs) || 0,
          commEggs: parseInt(formData.commEggs) || 0,
          waterEggs: parseInt(formData.waterEggs) || 0,
          jellyEggs: parseInt(formData.jellyEggs) || 0,
          creakEggs: parseInt(formData.creakEggs) || 0,
          leakerEggs: parseInt(formData.leakerEggs) || 0,
        }),
      })

      if (response.ok) {
        toast.success("Production record created successfully")
        setIsCreateDialogOpen(false)
        setFormData({
          date: new Date().toISOString().split('T')[0],
          shedId: "",
          totalEggs: "",
          normalEggs: "",
          commEggs: "",
          waterEggs: "0",
          jellyEggs: "0",
          creakEggs: "0",
          leakerEggs: "0",
          notes: "",
        })
        fetchProductions()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create production record")
      }
    } catch (error) {
      toast.error("Error creating production record")
    }
  }

  const handleEditProduction = (production: Production) => {
    setEditingProduction(production)
    setEditFormData({
      totalEggs: production.totalEggs.toString(),
      normalEggs: production.normalEggs.toString(),
      commEggs: production.commEggs.toString(),
      waterEggs: production.waterEggs.toString(),
      jellyEggs: production.jellyEggs.toString(),
      creakEggs: production.creakEggs.toString(),
      leakerEggs: production.leakerEggs.toString(),
      notes: production.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateProduction = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingProduction) return

    if (!validateEggCounts(editFormData)) {
      return
    }

    try {
      const response = await fetch(`/api/production/${editingProduction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalEggs: parseInt(editFormData.totalEggs),
          normalEggs: parseInt(editFormData.normalEggs) || 0,
          commEggs: parseInt(editFormData.commEggs) || 0,
          waterEggs: parseInt(editFormData.waterEggs) || 0,
          jellyEggs: parseInt(editFormData.jellyEggs) || 0,
          creakEggs: parseInt(editFormData.creakEggs) || 0,
          leakerEggs: parseInt(editFormData.leakerEggs) || 0,
          notes: editFormData.notes,
        }),
      })

      if (response.ok) {
        toast.success("Production record updated successfully")
        setIsEditDialogOpen(false)
        setEditingProduction(null)
        fetchProductions()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update production record")
      }
    } catch (error) {
      console.error("Error updating production:", error)
      toast.error("Error updating production record")
    }
  }

  const handleDeleteProduction = async (productionId: string) => {
    if (!confirm("Are you sure you want to delete this production record?")) {
      return
    }

    try {
      const response = await fetch(`/api/production/${productionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Production record deleted")
        fetchProductions()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete production record")
      }
    } catch (error) {
      console.error("Error deleting production:", error)
      toast.error("Error deleting production record")
    }
  }

  const calculateSellableEggs = (normal: number, comm: number) => {
    return normal + comm
  }

  const calculateWasteEggs = (water: number, jelly: number, creak: number, leaker: number) => {
    return water + jelly + creak + leaker
  }

  // For create form
  const totalEggs = parseInt(formData.totalEggs) || 0
  const normalEggs = parseInt(formData.normalEggs) || 0
  const commEggs = parseInt(formData.commEggs) || 0
  const waterEggs = parseInt(formData.waterEggs) || 0
  const jellyEggs = parseInt(formData.jellyEggs) || 0
  const creakEggs = parseInt(formData.creakEggs) || 0
  const leakerEggs = parseInt(formData.leakerEggs) || 0
  const sellableEggs = calculateSellableEggs(normalEggs, commEggs)
  const wasteEggs = calculateWasteEggs(waterEggs, jellyEggs, creakEggs, leakerEggs)
  const categorizedTotal = normalEggs + commEggs + waterEggs + jellyEggs + creakEggs + leakerEggs
  const uncategorized = Math.max(0, totalEggs - categorizedTotal)

  // For edit form
  const editTotalEggs = parseInt(editFormData.totalEggs) || 0
  const editNormalEggs = parseInt(editFormData.normalEggs) || 0
  const editCommEggs = parseInt(editFormData.commEggs) || 0
  const editWaterEggs = parseInt(editFormData.waterEggs) || 0
  const editJellyEggs = parseInt(editFormData.jellyEggs) || 0
  const editCreakEggs = parseInt(editFormData.creakEggs) || 0
  const editLeakerEggs = parseInt(editFormData.leakerEggs) || 0
  const editSellableEggs = calculateSellableEggs(editNormalEggs, editCommEggs)
  const editWasteEggs = calculateWasteEggs(editWaterEggs, editJellyEggs, editCreakEggs, editLeakerEggs)
  const editCategorizedTotal = editNormalEggs + editCommEggs + editWaterEggs + editJellyEggs + editCreakEggs + editLeakerEggs
  const editUncategorized = Math.max(0, editTotalEggs - editCategorizedTotal)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production Management</h1>
            <p className="text-gray-600">Track daily egg production with detailed categorization</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Production
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Record Production</DialogTitle>
                <DialogDescription>
                  Add daily egg production with detailed categorization
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProduction}>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="shedId">Shed *</Label>
                      <Select value={formData.shedId} onValueChange={(value) => setFormData({ ...formData, shedId: value })}>
                        <SelectTrigger id="shedId">
                          <SelectValue placeholder={sheds.length === 0 ? "Loading sheds..." : "Select a shed"} />
                        </SelectTrigger>
                        <SelectContent>
                          {sheds.length === 0 ? (
                            <SelectItem value="no-sheds" disabled>
                              No sheds available
                            </SelectItem>
                          ) : (
                            sheds.map((shed) => (
                              <SelectItem key={shed.id} value={shed.id}>
                                {shed.name} - {shed.farm.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="totalEggs">Total Eggs Collected</Label>
                    <Input
                      id="totalEggs"
                      type="number"
                      min="0"
                      value={formData.totalEggs}
                      onChange={(e) => setFormData({ ...formData, totalEggs: e.target.value })}
                      required
                      className="text-lg font-semibold"
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Egg Categorization</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="normalEggs" className="text-green-700">Normal Eggs (Grade A)</Label>
                        <Input
                          id="normalEggs"
                          type="number"
                          min="0"
                          value={formData.normalEggs}
                          onChange={(e) => setFormData({ ...formData, normalEggs: e.target.value })}
                          className="border-green-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="commEggs" className="text-blue-700">Commercial Eggs (Grade B)</Label>
                        <Input
                          id="commEggs"
                          type="number"
                          min="0"
                          value={formData.commEggs}
                          onChange={(e) => setFormData({ ...formData, commEggs: e.target.value })}
                          className="border-blue-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="waterEggs" className="text-purple-700">Water Eggs</Label>
                        <Input
                          id="waterEggs"
                          type="number"
                          min="0"
                          value={formData.waterEggs}
                          onChange={(e) => setFormData({ ...formData, waterEggs: e.target.value })}
                          className="border-purple-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="jellyEggs" className="text-orange-700">Jelly Eggs</Label>
                        <Input
                          id="jellyEggs"
                          type="number"
                          min="0"
                          value={formData.jellyEggs}
                          onChange={(e) => setFormData({ ...formData, jellyEggs: e.target.value })}
                          className="border-orange-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="creakEggs" className="text-red-700">Creak Eggs</Label>
                        <Input
                          id="creakEggs"
                          type="number"
                          min="0"
                          value={formData.creakEggs}
                          onChange={(e) => setFormData({ ...formData, creakEggs: e.target.value })}
                          className="border-red-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="leakerEggs" className="text-yellow-700">Leaker Eggs</Label>
                        <Input
                          id="leakerEggs"
                          type="number"
                          min="0"
                          value={formData.leakerEggs}
                          onChange={(e) => setFormData({ ...formData, leakerEggs: e.target.value })}
                          className="border-yellow-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-800">{sellableEggs}</div>
                        <div className="text-sm text-green-600">Sellable Eggs</div>
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-800">{wasteEggs}</div>
                        <div className="text-sm text-red-600">Waste Eggs</div>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{uncategorized}</div>
                        <div className="text-sm text-gray-600">Uncategorized</div>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${categorizedTotal > totalEggs ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${categorizedTotal > totalEggs ? 'text-red-800' : 'text-blue-800'}`}>
                          {Math.round((sellableEggs / Math.max(totalEggs, 1)) * 100)}%
                        </div>
                        <div className={`text-sm ${categorizedTotal > totalEggs ? 'text-red-600' : 'text-blue-600'}`}>
                          Efficiency
                        </div>
                      </div>
                    </div>
                  </div>

                  {categorizedTotal > totalEggs && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-red-800 text-sm">
                          Warning: Categorized eggs ({categorizedTotal}) exceed total eggs ({totalEggs})
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any additional notes about today's production..."
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={categorizedTotal > totalEggs}>
                    Record Production
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Production Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Production Record</DialogTitle>
              <DialogDescription>
                Update production record for {editingProduction?.shed.name} on {editingProduction ? new Date(editingProduction.date).toLocaleDateString() : ''}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateProduction}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="editTotalEggs">Total Eggs Collected</Label>
                  <Input
                    id="editTotalEggs"
                    type="number"
                    min="0"
                    value={editFormData.totalEggs}
                    onChange={(e) => setEditFormData({ ...editFormData, totalEggs: e.target.value })}
                    required
                    className="text-lg font-semibold"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Egg Categorization</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editNormalEggs" className="text-green-700">Normal Eggs (Grade A)</Label>
                      <Input
                        id="editNormalEggs"
                        type="number"
                        min="0"
                        value={editFormData.normalEggs}
                        onChange={(e) => setEditFormData({ ...editFormData, normalEggs: e.target.value })}
                        className="border-green-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editCommEggs" className="text-blue-700">Commercial Eggs (Grade B)</Label>
                      <Input
                        id="editCommEggs"
                        type="number"
                        min="0"
                        value={editFormData.commEggs}
                        onChange={(e) => setEditFormData({ ...editFormData, commEggs: e.target.value })}
                        className="border-blue-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editWaterEggs" className="text-purple-700">Water Eggs</Label>
                      <Input
                        id="editWaterEggs"
                        type="number"
                        min="0"
                        value={editFormData.waterEggs}
                        onChange={(e) => setEditFormData({ ...editFormData, waterEggs: e.target.value })}
                        className="border-purple-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editJellyEggs" className="text-orange-700">Jelly Eggs</Label>
                      <Input
                        id="editJellyEggs"
                        type="number"
                        min="0"
                        value={editFormData.jellyEggs}
                        onChange={(e) => setEditFormData({ ...editFormData, jellyEggs: e.target.value })}
                        className="border-orange-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editCreakEggs" className="text-red-700">Creak Eggs</Label>
                      <Input
                        id="editCreakEggs"
                        type="number"
                        min="0"
                        value={editFormData.creakEggs}
                        onChange={(e) => setEditFormData({ ...editFormData, creakEggs: e.target.value })}
                        className="border-red-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editLeakerEggs" className="text-yellow-700">Leaker Eggs</Label>
                      <Input
                        id="editLeakerEggs"
                        type="number"
                        min="0"
                        value={editFormData.leakerEggs}
                        onChange={(e) => setEditFormData({ ...editFormData, leakerEggs: e.target.value })}
                        className="border-yellow-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Edit Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-800">{editSellableEggs}</div>
                      <div className="text-sm text-green-600">Sellable Eggs</div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-800">{editWasteEggs}</div>
                      <div className="text-sm text-red-600">Waste Eggs</div>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{editUncategorized}</div>
                      <div className="text-sm text-gray-600">Uncategorized</div>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${editCategorizedTotal > editTotalEggs ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${editCategorizedTotal > editTotalEggs ? 'text-red-800' : 'text-blue-800'}`}>
                        {Math.round((editSellableEggs / Math.max(editTotalEggs, 1)) * 100)}%
                      </div>
                      <div className={`text-sm ${editCategorizedTotal > editTotalEggs ? 'text-red-600' : 'text-blue-600'}`}>
                        Efficiency
                      </div>
                    </div>
                  </div>
                </div>

                {editCategorizedTotal > editTotalEggs && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-red-800 text-sm">
                        Warning: Categorized eggs ({editCategorizedTotal}) exceed total eggs ({editTotalEggs})
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="editNotes">Notes</Label>
                  <Textarea
                    id="editNotes"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    placeholder="Any additional notes about this production..."
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editCategorizedTotal > editTotalEggs}>
                  Update Production
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Egg className="mr-2 h-5 w-5" />
              Production Records
            </CardTitle>
            <CardDescription>
              Daily egg production tracking with detailed categorization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading production records...</div>
            ) : productions.length === 0 ? (
              <div className="text-center py-8">
                <Egg className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No production records</h3>
                <p className="mt-1 text-sm text-gray-500">Start by recording today's production.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Shed</TableHead>
                      <TableHead>Farm</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-green-700">Normal</TableHead>
                      <TableHead className="text-blue-700">Comm</TableHead>
                      <TableHead className="text-purple-700">Water</TableHead>
                      <TableHead className="text-orange-700">Jelly</TableHead>
                      <TableHead className="text-red-700">Creak</TableHead>
                      <TableHead className="text-yellow-700">Leaker</TableHead>
                      <TableHead>Sellable</TableHead>
                      <TableHead>Efficiency</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(productions) && productions.map((production) => {
                      const sellable = production.normalEggs + production.commEggs
                      const efficiency = production.totalEggs > 0 ? Math.round((sellable / production.totalEggs) * 100) : 0
                      
                      return (
                        <TableRow key={production.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                              {new Date(production.date).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{production.shed.name}</TableCell>
                          <TableCell>{production.shed.farm.name}</TableCell>
                          <TableCell className="font-semibold">{production.totalEggs.toLocaleString()}</TableCell>
                          <TableCell className="text-green-700 font-medium">
                            {production.normalEggs.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-blue-700 font-medium">
                            {production.commEggs.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-purple-700">
                            {production.waterEggs.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-orange-700">
                            {production.jellyEggs.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-red-700">
                            {production.creakEggs.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-yellow-700">
                            {production.leakerEggs.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-green-600 font-semibold">
                            {sellable.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={efficiency >= 80 ? "default" : efficiency >= 60 ? "secondary" : "destructive"}>
                              {efficiency}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-600 hover:bg-blue-50"
                                onClick={() => handleEditProduction(production)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteProduction(production.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}