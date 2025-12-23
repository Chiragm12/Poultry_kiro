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
import { Plus, Egg, Calendar } from "lucide-react"
import { toast } from "sonner"
import DashboardLayout from "@/components/layout/dashboard-layout"

interface Production {
  id: string
  date: string
  totalEggs: number
  brokenEggs: number
  damagedEggs: number
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

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shedId: "",
    totalEggs: "",
    brokenEggs: "0",
    damagedEggs: "0",
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

        // Handle the API response format: { success: true, data: { productions: [...], pagination: {...} } }
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

        // Handle the API response format: { success: true, data: [...] }
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

  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.shedId) {
      toast.error("Please select a shed")
      return
    }

    if (!formData.totalEggs || parseInt(formData.totalEggs) < 0) {
      toast.error("Please enter a valid total eggs count")
      return
    }

    try {
      const response = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalEggs: parseInt(formData.totalEggs),
          brokenEggs: parseInt(formData.brokenEggs),
          damagedEggs: parseInt(formData.damagedEggs),
        }),
      })

      if (response.ok) {
        toast.success("Production record created successfully")
        setIsCreateDialogOpen(false)
        setFormData({
          date: new Date().toISOString().split('T')[0],
          shedId: "",
          totalEggs: "",
          brokenEggs: "0",
          damagedEggs: "0",
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

  const calculateGoodEggs = (total: number, broken: number, damaged: number) => {
    return Math.max(0, total - broken - damaged)
  }

  const totalEggs = parseInt(formData.totalEggs) || 0
  const brokenEggs = parseInt(formData.brokenEggs) || 0
  const damagedEggs = parseInt(formData.damagedEggs) || 0
  const goodEggs = calculateGoodEggs(totalEggs, brokenEggs, damagedEggs)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production Management</h1>
            <p className="text-gray-600">Track daily egg production across all sheds</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Production
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Production</DialogTitle>
                <DialogDescription>
                  Add daily egg production for a shed
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProduction}>
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
                    <Label htmlFor="shedId">Shed *</Label>
                    <Select value={formData.shedId} onValueChange={(value) => setFormData({ ...formData, shedId: value })}>
                      <SelectTrigger id="shedId">
                        <SelectValue placeholder={sheds.length === 0 ? "Loading sheds..." : "Select a shed"} />
                      </SelectTrigger>
                      <SelectContent>
                        {sheds.length === 0 ? (
                          <SelectItem value="no-sheds" disabled>
                            No sheds available - Check if you're logged in and have farms/sheds created
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
                    {sheds.length === 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        No sheds found. Make sure you have farms and sheds created, or try refreshing the page.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="totalEggs">Total Eggs</Label>
                    <Input
                      id="totalEggs"
                      type="number"
                      min="0"
                      value={formData.totalEggs}
                      onChange={(e) => setFormData({ ...formData, totalEggs: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brokenEggs">Broken Eggs</Label>
                      <Input
                        id="brokenEggs"
                        type="number"
                        min="0"
                        value={formData.brokenEggs}
                        onChange={(e) => setFormData({ ...formData, brokenEggs: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="damagedEggs">Damaged Eggs</Label>
                      <Input
                        id="damagedEggs"
                        type="number"
                        min="0"
                        value={formData.damagedEggs}
                        onChange={(e) => setFormData({ ...formData, damagedEggs: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-800">Sellable Eggs:</span>
                      <span className="text-lg font-bold text-green-900">{goodEggs}</span>
                    </div>
                  </div>
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
                  <Button type="submit">Record Production</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Egg className="mr-2 h-5 w-5" />
              Production Records
            </CardTitle>
            <CardDescription>
              Daily egg production tracking across all sheds
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Shed</TableHead>
                    <TableHead>Farm</TableHead>
                    <TableHead>Total Eggs</TableHead>
                    <TableHead>Sellable Eggs</TableHead>
                    <TableHead>Broken</TableHead>
                    <TableHead>Damaged</TableHead>
                    <TableHead>Efficiency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(productions) && productions.map((production) => (
                    <TableRow key={production.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                          {new Date(production.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{production.shed.name}</TableCell>
                      <TableCell>{production.shed.farm.name}</TableCell>
                      <TableCell>{production.totalEggs.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {production.sellableEggs.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {production.brokenEggs.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        {production.damagedEggs.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {production.totalEggs > 0
                            ? Math.round((production.sellableEggs / production.totalEggs) * 100)
                            : 0}%
                        </span>
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