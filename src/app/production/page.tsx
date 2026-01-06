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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Egg, Calendar, Edit, Trash2, AlertTriangle, Users, TrendingDown, Package, BarChart3, TrendingUp, Download } from "lucide-react"
import { toast } from "sonner"
import DashboardLayout from "@/components/layout/dashboard-layout"

interface Production {
  id: string
  date: string
  tableEggs: number
  hatchingEggs: number
  crackedEggs: number
  jumboEggs: number
  leakerEggs: number
  totalEggs: number
  inchargeEggs: number
  notes?: string
  farm: {
    id: string
    name: string
    location: string
  }
  createdAt: string
}

interface MortalityRecord {
  id: string
  date: string
  maleMortality: number
  femaleMortality: number
  notes?: string
  farmId: string
  farm?: {
    id: string
    name: string
    location: string
  }
}

interface DispatchRecord {
  id: string
  date: string
  tableEggs: number
  hatchingEggs: number
  crackedEggs: number
  jumboEggs: number
  leakerEggs: number
  totalDispatched: number
  notes?: string
  farmId: string
  farm?: {
    id: string
    name: string
    location: string
  }
}

interface FlockData {
  id: string
  date: string
  ageWeeks: number
  ageDayOfWeek: number
  openingFemale: number
  openingMale: number
  mortalityF: number
  mortalityM: number
  closingFemale: number
  closingMale: number
  farmId: string
}


interface Farm {
  id: string
  name: string
  location: string
  maleCount?: number
  femaleCount?: number
}

export default function ProductionPage() {
  const [productions, setProductions] = useState<Production[]>([])
  const [mortalityRecords, setMortalityRecords] = useState<MortalityRecord[]>([])
  const [dispatchRecords, setDispatchRecords] = useState<DispatchRecord[]>([])
  const [flockData, setFlockData] = useState<FlockData[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("production")

  // Dialog states
  const [isProductionDialogOpen, setIsProductionDialogOpen] = useState(false)
  const [isMortalityDialogOpen, setIsMortalityDialogOpen] = useState(false)
  const [isDispatchDialogOpen, setIsDispatchDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingProductionId, setEditingProductionId] = useState<string | null>(null)

  // Form data states
  const [productionForm, setProductionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    farmId: "",
    tableEggs: "",
    hatchingEggs: "",
    crackedEggs: "",
    jumboEggs: "",
    leakerEggs: "",
    inchargeEggs: "",
    notes: "",
  })

  const [mortalityForm, setMortalityForm] = useState({
    date: new Date().toISOString().split('T')[0],
    farmId: "",
    maleMortality: "",
    femaleMortality: "",
    notes: "",
  })

  const [dispatchForm, setDispatchForm] = useState({
    date: new Date().toISOString().split('T')[0],
    farmId: "",
    tableEggs: "",
    hatchingEggs: "",
    crackedEggs: "",
    jumboEggs: "",
    leakerEggs: "",
    notes: "",
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchProductions(),
        fetchFarms(),
        fetchMortalityRecords(),
        fetchDispatchRecords(),
        fetchFlockData()
      ])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProductions = async () => {
    try {
      const response = await fetch("/api/production")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setProductions(Array.isArray(result.data.productions) ? result.data.productions : result.data)
        }
      }
    } catch (error) {
      console.error("Error fetching productions:", error)
    }
  }

  const fetchFarms = async () => {
    try {
      const response = await fetch("/api/farms")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setFarms(result.data)
        }
      }
    } catch (error) {
      console.error("Error fetching farms:", error)
    }
  }

  const fetchMortalityRecords = async () => {
    try {
      const response = await fetch("/api/mortality")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setMortalityRecords(Array.isArray(result.data) ? result.data : [])
        } else {
          console.error("Invalid mortality data format:", result)
          setMortalityRecords([])
        }
      } else {
        console.error("Failed to fetch mortality records:", response.status)
        setMortalityRecords([])
      }
    } catch (error) {
      console.error("Error fetching mortality records:", error)
      setMortalityRecords([])
    }
  }

  const fetchDispatchRecords = async () => {
    try {
      const response = await fetch("/api/dispatch")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setDispatchRecords(Array.isArray(result.data) ? result.data : [])
        } else {
          console.error("Invalid dispatch data format:", result)
          setDispatchRecords([])
        }
      } else {
        console.error("Failed to fetch dispatch records:", response.status)
        setDispatchRecords([])
      }
    } catch (error) {
      console.error("Error fetching dispatch records:", error)
      setDispatchRecords([])
    }
  }

  const fetchFlockData = async () => {
    try {
      const response = await fetch("/api/flock")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setFlockData(result.data)
        }
      }
    } catch (error) {
      console.error("Error fetching flock data:", error)
    }
  }

  const calculateTotalEggs = (form: any) => {
    const table = parseInt(form.tableEggs) || 0
    const hatching = parseInt(form.hatchingEggs) || 0
    const cracked = parseInt(form.crackedEggs) || 0
    const jumbo = parseInt(form.jumboEggs) || 0
    const leaker = parseInt(form.leakerEggs) || 0
    return table + hatching + cracked + jumbo + leaker
  }

  const handleProductionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!productionForm.farmId) {
      toast.error("Please select a farm")
      return
    }

    const totalEggs = calculateTotalEggs(productionForm)
    if (totalEggs === 0) {
      toast.error("Please enter at least one egg count")
      return
    }

    try {
      const url = isEditMode ? `/api/production/${editingProductionId}` : "/api/production"
      const method = isEditMode ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productionForm,
          tableEggs: parseInt(productionForm.tableEggs) || 0,
          hatchingEggs: parseInt(productionForm.hatchingEggs) || 0,
          crackedEggs: parseInt(productionForm.crackedEggs) || 0,
          jumboEggs: parseInt(productionForm.jumboEggs) || 0,
          leakerEggs: parseInt(productionForm.leakerEggs) || 0,
          inchargeEggs: parseInt(productionForm.inchargeEggs) || 0,
          totalEggs,
        }),
      })

      if (response.ok) {
        toast.success(isEditMode ? "Production updated successfully" : "Production recorded successfully")
        setIsProductionDialogOpen(false)
        resetProductionForm()
        fetchProductions()
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to ${isEditMode ? 'update' : 'record'} production`)
      }
    } catch (error) {
      console.error("Error with production:", error)
      toast.error(`Error ${isEditMode ? 'updating' : 'recording'} production`)
    }
  }

  const resetProductionForm = () => {
    setProductionForm({
      date: new Date().toISOString().split('T')[0],
      farmId: "",
      tableEggs: "",
      hatchingEggs: "",
      crackedEggs: "",
      jumboEggs: "",
      leakerEggs: "",
      inchargeEggs: "",
      notes: "",
    })
    setIsEditMode(false)
    setEditingProductionId(null)
  }

  const handleEditProduction = (production: Production) => {
    setProductionForm({
      date: new Date(production.date).toISOString().split('T')[0],
      farmId: production.farm.id,
      tableEggs: production.tableEggs.toString(),
      hatchingEggs: production.hatchingEggs.toString(),
      crackedEggs: production.crackedEggs.toString(),
      jumboEggs: production.jumboEggs.toString(),
      leakerEggs: production.leakerEggs.toString(),
      inchargeEggs: (production as any).inchargeEggs?.toString() || "0",
      notes: production.notes || "",
    })
    setIsEditMode(true)
    setEditingProductionId(production.id)
    setIsProductionDialogOpen(true)
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
        toast.success("Production record deleted successfully")
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

  const handleMortalitySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!mortalityForm.farmId) {
      toast.error("Please select a farm")
      return
    }

    const totalMortality = (parseInt(mortalityForm.maleMortality) || 0) + (parseInt(mortalityForm.femaleMortality) || 0)
    if (totalMortality === 0) {
      toast.error("Please enter mortality data")
      return
    }

    try {
      const response = await fetch("/api/mortality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...mortalityForm,
          maleMortality: parseInt(mortalityForm.maleMortality) || 0,
          femaleMortality: parseInt(mortalityForm.femaleMortality) || 0,
        }),
      })

      if (response.ok) {
        toast.success("Mortality recorded successfully")
        setIsMortalityDialogOpen(false)
        setMortalityForm({
          date: new Date().toISOString().split('T')[0],
          farmId: "",
          maleMortality: "",
          femaleMortality: "",
          notes: "",
        })
        // Refresh all data to ensure consistency
        await fetchMortalityRecords()
        await fetchFarms() // Refresh farms to get updated counts
        await fetchFlockData()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to record mortality")
      }
    } catch (error) {
      console.error("Error recording mortality:", error)
      toast.error("Error recording mortality")
    }
  }

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dispatchForm.farmId) {
      toast.error("Please select a farm")
      return
    }

    const totalDispatched = calculateTotalEggs(dispatchForm)
    if (totalDispatched === 0) {
      toast.error("Please enter dispatch quantities")
      return
    }

    try {
      const response = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dispatchForm,
          tableEggs: parseInt(dispatchForm.tableEggs) || 0,
          hatchingEggs: parseInt(dispatchForm.hatchingEggs) || 0,
          crackedEggs: parseInt(dispatchForm.crackedEggs) || 0,
          jumboEggs: parseInt(dispatchForm.jumboEggs) || 0,
          leakerEggs: parseInt(dispatchForm.leakerEggs) || 0,
        }),
      })

      if (response.ok) {
        toast.success("Dispatch recorded successfully")
        setIsDispatchDialogOpen(false)
        setDispatchForm({
          date: new Date().toISOString().split('T')[0],
          farmId: "",
          tableEggs: "",
          hatchingEggs: "",
          crackedEggs: "",
          jumboEggs: "",
          leakerEggs: "",
          notes: "",
        })
        // Refresh all data to ensure consistency
        await fetchDispatchRecords()
        await fetchProductions()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to record dispatch")
      }
    } catch (error) {
      console.error("Error recording dispatch:", error)
      toast.error("Error recording dispatch")
    }
  }

  const getColdRoomStock = (production: Production, dispatch?: DispatchRecord) => {
    if (!dispatch) return production.totalEggs
    return production.totalEggs - dispatch.totalDispatched
  }

  // Calculate current flock status from farm data
  const calculateFlockStatus = () => {
    if (farms.length === 0) {
      return { maleCount: 0, femaleCount: 0, totalCount: 0 }
    }

    // Sum up the male and female counts from all farms
    const totals = farms.reduce(
      (sum, farm) => ({
        maleCount: sum.maleCount + (farm.maleCount || 0),
        femaleCount: sum.femaleCount + (farm.femaleCount || 0),
        totalCount: sum.totalCount + (farm.maleCount || 0) + (farm.femaleCount || 0),
      }),
      { maleCount: 0, femaleCount: 0, totalCount: 0 }
    )

    return totals
  }

  // Calculate cold room stock totals
  const calculateColdRoomStock = () => {
    const totalProduction = productions.reduce(
      (sum, prod) => ({
        tableEggs: sum.tableEggs + prod.tableEggs,
        hatchingEggs: sum.hatchingEggs + prod.hatchingEggs,
        crackedEggs: sum.crackedEggs + prod.crackedEggs,
        jumboEggs: sum.jumboEggs + prod.jumboEggs,
        leakerEggs: sum.leakerEggs + prod.leakerEggs,
        totalEggs: sum.totalEggs + prod.totalEggs,
      }),
      { tableEggs: 0, hatchingEggs: 0, crackedEggs: 0, jumboEggs: 0, leakerEggs: 0, totalEggs: 0 }
    )

    const totalDispatched = dispatchRecords.reduce(
      (sum, dispatch) => ({
        tableEggs: sum.tableEggs + dispatch.tableEggs,
        hatchingEggs: sum.hatchingEggs + dispatch.hatchingEggs,
        crackedEggs: sum.crackedEggs + dispatch.crackedEggs,
        jumboEggs: sum.jumboEggs + dispatch.jumboEggs,
        leakerEggs: sum.leakerEggs + dispatch.leakerEggs,
        totalDispatched: sum.totalDispatched + dispatch.totalDispatched,
      }),
      { tableEggs: 0, hatchingEggs: 0, crackedEggs: 0, jumboEggs: 0, leakerEggs: 0, totalDispatched: 0 }
    )

    return {
      tableEggs: totalProduction.tableEggs - totalDispatched.tableEggs,
      hatchingEggs: totalProduction.hatchingEggs - totalDispatched.hatchingEggs,
      crackedEggs: totalProduction.crackedEggs - totalDispatched.crackedEggs,
      jumboEggs: totalProduction.jumboEggs - totalDispatched.jumboEggs,
      leakerEggs: totalProduction.leakerEggs - totalDispatched.leakerEggs,
      totalStock: totalProduction.totalEggs - totalDispatched.totalDispatched,
      totalProduced: totalProduction.totalEggs,
      totalDispatched: totalDispatched.totalDispatched,
    }
  }

  // Calculate comparison metrics
  const calculateComparisonMetrics = () => {
    const coldRoomData = calculateColdRoomStock()

    const heProduction = productions.reduce((sum, prod) => sum + prod.hatchingEggs, 0)
    const hdProduction = productions.reduce((sum, prod) => sum + prod.totalEggs, 0)

    const heDispatched = dispatchRecords.reduce((sum, dispatch) => sum + dispatch.hatchingEggs, 0)
    const hdDispatched = dispatchRecords.reduce((sum, dispatch) => sum + dispatch.totalDispatched, 0)

    const heStock = heProduction - heDispatched
    const hdStock = hdProduction - hdDispatched

    const heHdRatio = hdProduction > 0 ? (heProduction / hdProduction) * 100 : 0
    const heDispatchRate = heProduction > 0 ? (heDispatched / heProduction) * 100 : 0
    const hdDispatchRate = hdProduction > 0 ? (hdDispatched / hdProduction) * 100 : 0

    return {
      heProduction,
      hdProduction,
      heDispatched,
      hdDispatched,
      heStock,
      hdStock,
      heHdRatio,
      heDispatchRate,
      hdDispatchRate,
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production Management</h1>
            <p className="text-gray-600 mt-1">
              Track daily egg production, mortality, and dispatch operations
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-lg font-semibold text-blue-600">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="mortality">Mortality</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          {/* Production Tab */}
          <TabsContent value="production" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Daily Production Records</h2>
              <Dialog open={isProductionDialogOpen} onOpenChange={setIsProductionDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Record Production
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Production Record' : 'Record Daily Production'}</DialogTitle>
                    <DialogDescription>
                      {isEditMode ? 'Update the production data' : 'Enter egg production data for today'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleProductionSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={productionForm.date}
                          onChange={(e) => setProductionForm({ ...productionForm, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="farm">Farm</Label>
                        <Select value={productionForm.farmId} onValueChange={(value) => setProductionForm({ ...productionForm, farmId: value })}>
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tableEggs">Table Eggs</Label>
                        <Input
                          id="tableEggs"
                          type="number"
                          min="0"
                          value={productionForm.tableEggs}
                          onChange={(e) => setProductionForm({ ...productionForm, tableEggs: e.target.value })}
                          className="bg-blue-50 border-blue-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hatchingEggs">Hatching Eggs</Label>
                        <Input
                          id="hatchingEggs"
                          type="number"
                          min="0"
                          value={productionForm.hatchingEggs}
                          onChange={(e) => setProductionForm({ ...productionForm, hatchingEggs: e.target.value })}
                          className="bg-green-50 border-green-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="crackedEggs">Cracked</Label>
                        <Input
                          id="crackedEggs"
                          type="number"
                          min="0"
                          value={productionForm.crackedEggs}
                          onChange={(e) => setProductionForm({ ...productionForm, crackedEggs: e.target.value })}
                          className="bg-yellow-50 border-yellow-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jumboEggs">Jumbo</Label>
                        <Input
                          id="jumboEggs"
                          type="number"
                          min="0"
                          value={productionForm.jumboEggs}
                          onChange={(e) => setProductionForm({ ...productionForm, jumboEggs: e.target.value })}
                          className="bg-purple-50 border-purple-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="leakerEggs">Leaker</Label>
                        <Input
                          id="leakerEggs"
                          type="number"
                          min="0"
                          value={productionForm.leakerEggs}
                          onChange={(e) => setProductionForm({ ...productionForm, leakerEggs: e.target.value })}
                          className="bg-red-50 border-red-200"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">Total HD Eggs</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {calculateTotalEggs(productionForm)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inchargeEggs">Incharge Eggs</Label>
                      <Input
                        id="inchargeEggs"
                        type="number"
                        min="0"
                        value={productionForm.inchargeEggs}
                        onChange={(e) => setProductionForm({ ...productionForm, inchargeEggs: e.target.value })}
                        className="bg-orange-50 border-orange-200"
                        placeholder="Total HD eggs + extra eggs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={productionForm.notes}
                        onChange={(e) => setProductionForm({ ...productionForm, notes: e.target.value })}
                        placeholder="Any additional notes..."
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => {
                        setIsProductionDialogOpen(false)
                        resetProductionForm()
                      }}>
                        Cancel
                      </Button>
                      <Button type="submit">{isEditMode ? 'Update Production' : 'Record Production'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Farm</TableHead>
                      <TableHead>Table Eggs</TableHead>
                      <TableHead>Hatching Eggs</TableHead>
                      <TableHead>Cracked</TableHead>
                      <TableHead>Jumbo</TableHead>
                      <TableHead>Leaker</TableHead>
                      <TableHead>Total HD Eggs</TableHead>
                      <TableHead>Incharge Eggs</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          Loading production records...
                        </TableCell>
                      </TableRow>
                    ) : productions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          No production records found. Record your first production!
                        </TableCell>
                      </TableRow>
                    ) : (
                      productions.map((production) => (
                        <TableRow key={production.id}>
                          <TableCell>{new Date(production.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{production.farm.name}</div>
                              <div className="text-sm text-gray-500">{production.farm.location}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {production.tableEggs}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {production.hatchingEggs}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              {production.crackedEggs}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                              {production.jumboEggs}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              {production.leakerEggs}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-blue-600">
                              {production.totalEggs}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              {production.inchargeEggs}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProduction(production)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteProduction(production.id)}
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
          </TabsContent>
          {/* Mortality Tab */}
          <TabsContent value="mortality" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Mortality Records</h2>
              <Dialog open={isMortalityDialogOpen} onOpenChange={setIsMortalityDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Record Mortality
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Record Mortality</DialogTitle>
                    <DialogDescription>
                      Enter daily mortality data for male and female chickens
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleMortalitySubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mortalityDate">Date</Label>
                        <Input
                          id="mortalityDate"
                          type="date"
                          value={mortalityForm.date}
                          onChange={(e) => setMortalityForm({ ...mortalityForm, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mortalityFarm">Farm</Label>
                        <Select value={mortalityForm.farmId} onValueChange={(value) => setMortalityForm({ ...mortalityForm, farmId: value })}>
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maleMortality">Male Mortality</Label>
                        <Input
                          id="maleMortality"
                          type="number"
                          min="0"
                          value={mortalityForm.maleMortality}
                          onChange={(e) => setMortalityForm({ ...mortalityForm, maleMortality: e.target.value })}
                          className="bg-blue-50 border-blue-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="femaleMortality">Female Mortality</Label>
                        <Input
                          id="femaleMortality"
                          type="number"
                          min="0"
                          value={mortalityForm.femaleMortality}
                          onChange={(e) => setMortalityForm({ ...mortalityForm, femaleMortality: e.target.value })}
                          className="bg-pink-50 border-pink-200"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">Total Mortality</div>
                      <div className="text-2xl font-bold text-red-600">
                        {(parseInt(mortalityForm.maleMortality) || 0) + (parseInt(mortalityForm.femaleMortality) || 0)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mortalityNotes">Notes (Optional)</Label>
                      <Textarea
                        id="mortalityNotes"
                        value={mortalityForm.notes}
                        onChange={(e) => setMortalityForm({ ...mortalityForm, notes: e.target.value })}
                        placeholder="Cause of mortality, observations..."
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsMortalityDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Record Mortality</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current Flock Status */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Current Flock Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {calculateFlockStatus().maleCount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Male Chickens</div>
                    </div>
                    <div className="text-center p-3 bg-pink-50 rounded-lg">
                      <div className="text-2xl font-bold text-pink-600">
                        {calculateFlockStatus().femaleCount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Female Chickens</div>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800">
                      {calculateFlockStatus().totalCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Flock</div>
                  </div>
                </CardContent>
              </Card>

              {/* Mortality Records Table */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Mortality Records</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Farm</TableHead>
                        <TableHead>Male</TableHead>
                        <TableHead>Female</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Updated Counts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading mortality records...</p>
                          </TableCell>
                        </TableRow>
                      ) : mortalityRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No mortality records found. Record your first mortality data!
                          </TableCell>
                        </TableRow>
                      ) : (
                        mortalityRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{record.farm?.name || 'Unknown Farm'}</div>
                                <div className="text-sm text-gray-500">{record.farm?.location || 'Unknown Location'}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {record.maleMortality}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                                {record.femaleMortality}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">
                                {record.maleMortality + record.femaleMortality}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>Updated counts after mortality</div>
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
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Dispatch Tracking & Cold Room Stock</h2>
              <Dialog open={isDispatchDialogOpen} onOpenChange={setIsDispatchDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Package className="mr-2 h-4 w-4" />
                    Record Dispatch
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Record Dispatch</DialogTitle>
                    <DialogDescription>
                      Enter eggs dispatched by category
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleDispatchSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dispatchDate">Date</Label>
                        <Input
                          id="dispatchDate"
                          type="date"
                          value={dispatchForm.date}
                          onChange={(e) => setDispatchForm({ ...dispatchForm, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dispatchFarm">Farm</Label>
                        <Select value={dispatchForm.farmId} onValueChange={(value) => setDispatchForm({ ...dispatchForm, farmId: value })}>
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dispatchTableEggs">Table Eggs</Label>
                        <Input
                          id="dispatchTableEggs"
                          type="number"
                          min="0"
                          value={dispatchForm.tableEggs}
                          onChange={(e) => setDispatchForm({ ...dispatchForm, tableEggs: e.target.value })}
                          className="bg-blue-50 border-blue-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dispatchHatchingEggs">Hatching Eggs</Label>
                        <Input
                          id="dispatchHatchingEggs"
                          type="number"
                          min="0"
                          value={dispatchForm.hatchingEggs}
                          onChange={(e) => setDispatchForm({ ...dispatchForm, hatchingEggs: e.target.value })}
                          className="bg-green-50 border-green-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="dispatchCrackedEggs">Cracked</Label>
                        <Input
                          id="dispatchCrackedEggs"
                          type="number"
                          min="0"
                          value={dispatchForm.crackedEggs}
                          onChange={(e) => setDispatchForm({ ...dispatchForm, crackedEggs: e.target.value })}
                          className="bg-yellow-50 border-yellow-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dispatchJumboEggs">Jumbo</Label>
                        <Input
                          id="dispatchJumboEggs"
                          type="number"
                          min="0"
                          value={dispatchForm.jumboEggs}
                          onChange={(e) => setDispatchForm({ ...dispatchForm, jumboEggs: e.target.value })}
                          className="bg-purple-50 border-purple-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dispatchLeakerEggs">Leaker</Label>
                        <Input
                          id="dispatchLeakerEggs"
                          type="number"
                          min="0"
                          value={dispatchForm.leakerEggs}
                          onChange={(e) => setDispatchForm({ ...dispatchForm, leakerEggs: e.target.value })}
                          className="bg-red-50 border-red-200"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">Total Dispatched</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {calculateTotalEggs(dispatchForm)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dispatchNotes">Notes (Optional)</Label>
                      <Textarea
                        id="dispatchNotes"
                        value={dispatchForm.notes}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, notes: e.target.value })}
                        placeholder="Destination, transport details..."
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDispatchDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Record Dispatch</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cold Room Stock Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    Cold Room Stock Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">
                          {calculateColdRoomStock().tableEggs.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Table Eggs</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600">
                          {calculateColdRoomStock().hatchingEggs.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Hatching Eggs</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-yellow-50 rounded-lg">
                        <div className="text-lg font-bold text-yellow-600">
                          {calculateColdRoomStock().crackedEggs.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Cracked</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">
                          {calculateColdRoomStock().jumboEggs.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Jumbo</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded-lg">
                        <div className="text-lg font-bold text-red-600">
                          {calculateColdRoomStock().leakerEggs.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Leaker</div>
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                      <div className="text-2xl font-bold text-gray-800">
                        {calculateColdRoomStock().totalStock.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Stock</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dispatch Records */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Dispatch Records</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Farm</TableHead>
                        <TableHead>Total Dispatched</TableHead>
                        <TableHead>Breakdown</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading dispatch records...</p>
                          </TableCell>
                        </TableRow>
                      ) : dispatchRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            No dispatch records found. Record your first dispatch!
                          </TableCell>
                        </TableRow>
                      ) : (
                        dispatchRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{record.farm?.name || 'Unknown Farm'}</div>
                                <div className="text-sm text-gray-500">{record.farm?.location || 'Unknown Location'}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                {record.totalDispatched}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>Table: {record.tableEggs}</div>
                                <div>Hatching: {record.hatchingEggs}</div>
                                <div>Others: {record.crackedEggs + record.jumboEggs + record.leakerEggs}</div>
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
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">HE vs HD Eggs Comparison</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Summary Cards */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700">
                    <Egg className="mr-2 h-5 w-5" />
                    HE Eggs (Hatching)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">
                        {calculateComparisonMetrics().heProduction.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Production</div>
                    </div>
                    <div className="text-center p-3 bg-green-100 rounded-lg">
                      <div className="text-xl font-bold text-green-700">
                        {calculateComparisonMetrics().heDispatched.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Eggs Sold</div>
                    </div>
                    <div className="text-center p-3 bg-green-200 rounded-lg">
                      <div className="text-xl font-bold text-green-800">
                        {calculateComparisonMetrics().heStock.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Cold Room Stock</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-700">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    HD Eggs (All Categories)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">
                        {calculateComparisonMetrics().hdProduction.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Production</div>
                    </div>
                    <div className="text-center p-3 bg-blue-100 rounded-lg">
                      <div className="text-xl font-bold text-blue-700">
                        {calculateComparisonMetrics().hdDispatched.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Eggs Sold</div>
                    </div>
                    <div className="text-center p-3 bg-blue-200 rounded-lg">
                      <div className="text-xl font-bold text-blue-800">
                        {calculateComparisonMetrics().hdStock.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Cold Room Stock</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-700">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Comparison Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">
                        {calculateComparisonMetrics().heHdRatio.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">HE/HD Ratio</div>
                    </div>
                    <div className="text-center p-3 bg-purple-100 rounded-lg">
                      <div className="text-xl font-bold text-purple-700">
                        {calculateComparisonMetrics().heDispatchRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">HE Dispatch Rate</div>
                    </div>
                    <div className="text-center p-3 bg-purple-200 rounded-lg">
                      <div className="text-xl font-bold text-purple-800">
                        {calculateComparisonMetrics().hdDispatchRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">HD Dispatch Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Comparison Data</CardTitle>
                <CardDescription>
                  Compare HE and HD egg production, dispatch, and stock levels
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>HE Production</TableHead>
                      <TableHead>HD Production</TableHead>
                      <TableHead>HE Dispatched</TableHead>
                      <TableHead>Total Eggs Sold</TableHead>
                      <TableHead>HE Stock</TableHead>
                      <TableHead>HD Stock</TableHead>
                      <TableHead>HE/HD Ratio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No production data available for comparison
                        </TableCell>
                      </TableRow>
                    ) : (
                      productions.slice(0, 10).map((production) => {
                        const heProduction = production.hatchingEggs
                        const hdProduction = production.totalEggs

                        // Find corresponding dispatch record for this production
                        const correspondingDispatch = dispatchRecords.find(
                          dispatch => dispatch.farmId === production.farm.id &&
                            new Date(dispatch.date).toDateString() === new Date(production.date).toDateString()
                        )

                        const heDispatched = correspondingDispatch?.hatchingEggs || 0
                        const hdDispatched = correspondingDispatch?.totalDispatched || 0
                        const heStock = heProduction - heDispatched
                        const hdStock = hdProduction - hdDispatched
                        const ratio = hdProduction > 0 ? ((heProduction / hdProduction) * 100).toFixed(1) : "0.0"

                        return (
                          <TableRow key={production.id}>
                            <TableCell>{new Date(production.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {heProduction}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {hdProduction}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-green-300 text-green-700">
                                {heDispatched}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-blue-300 text-blue-700">
                                {hdDispatched}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-green-600">{heStock}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-blue-600">{hdStock}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                {ratio}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}