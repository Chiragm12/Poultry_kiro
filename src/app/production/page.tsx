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
import { Plus, Egg, Calendar, Edit, Trash2, AlertTriangle, Users, TrendingDown, Package, BarChart3, TrendingUp } from "lucide-react"
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

interface MortalityRecord {
  id: string
  date: string
  maleMortality: number
  femaleMortality: number
  notes?: string
  shedId: string
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
  shedId: string
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
  shedId: string
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
  const [mortalityRecords, setMortalityRecords] = useState<MortalityRecord[]>([])
  const [dispatchRecords, setDispatchRecords] = useState<DispatchRecord[]>([])
  const [flockData, setFlockData] = useState<FlockData[]>([])
  const [sheds, setSheds] = useState<Shed[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("production")

  // Dialog states
  const [isProductionDialogOpen, setIsProductionDialogOpen] = useState(false)
  const [isMortalityDialogOpen, setIsMortalityDialogOpen] = useState(false)
  const [isDispatchDialogOpen, setIsDispatchDialogOpen] = useState(false)

  // Form data states
  const [productionForm, setProductionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shedId: "",
    tableEggs: "",
    hatchingEggs: "",
    crackedEggs: "",
    jumboEggs: "",
    leakerEggs: "",
    notes: "",
  })

  const [mortalityForm, setMortalityForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shedId: "",
    maleMortality: "",
    femaleMortality: "",
    notes: "",
  })

  const [dispatchForm, setDispatchForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shedId: "",
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
        fetchSheds(),
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

  const fetchSheds = async () => {
    try {
      const response = await fetch("/api/sheds")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setSheds(result.data)
        }
      }
    } catch (error) {
      console.error("Error fetching sheds:", error)
    }
  }

  const fetchMortalityRecords = async () => {
    try {
      const response = await fetch("/api/mortality")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setMortalityRecords(result.data)
        }
      }
    } catch (error) {
      console.error("Error fetching mortality records:", error)
    }
  }

  const fetchDispatchRecords = async () => {
    try {
      const response = await fetch("/api/dispatch")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setDispatchRecords(result.data)
        }
      }
    } catch (error) {
      console.error("Error fetching dispatch records:", error)
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
    
    if (!productionForm.shedId) {
      toast.error("Please select a shed")
      return
    }

    const totalEggs = calculateTotalEggs(productionForm)
    if (totalEggs === 0) {
      toast.error("Please enter at least one egg count")
      return
    }

    try {
      const response = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productionForm,
          tableEggs: parseInt(productionForm.tableEggs) || 0,
          hatchingEggs: parseInt(productionForm.hatchingEggs) || 0,
          crackedEggs: parseInt(productionForm.crackedEggs) || 0,
          jumboEggs: parseInt(productionForm.jumboEggs) || 0,
          leakerEggs: parseInt(productionForm.leakerEggs) || 0,
          totalEggs,
        }),
      })

      if (response.ok) {
        toast.success("Production recorded successfully")
        setIsProductionDialogOpen(false)
        setProductionForm({
          date: new Date().toISOString().split('T')[0],
          shedId: "",
          tableEggs: "",
          hatchingEggs: "",
          crackedEggs: "",
          jumboEggs: "",
          leakerEggs: "",
          notes: "",
        })
        fetchProductions()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to record production")
      }
    } catch (error) {
      console.error("Error recording production:", error)
      toast.error("Error recording production")
    }
  }

  const handleMortalitySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!mortalityForm.shedId) {
      toast.error("Please select a shed")
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
          shedId: "",
          maleMortality: "",
          femaleMortality: "",
          notes: "",
        })
        fetchMortalityRecords()
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
    
    if (!dispatchForm.shedId) {
      toast.error("Please select a shed")
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
          shedId: "",
          tableEggs: "",
          hatchingEggs: "",
          crackedEggs: "",
          jumboEggs: "",
          leakerEggs: "",
          notes: "",
        })
        fetchDispatchRecords()
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
                    <DialogTitle>Record Daily Production</DialogTitle>
                    <DialogDescription>
                      Enter egg production data for today
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
                          onChange={(e) => setProductionForm({...productionForm, date: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shed">Shed</Label>
                        <Select value={productionForm.shedId} onValueChange={(value) => setProductionForm({...productionForm, shedId: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select shed" />
                          </SelectTrigger>
                          <SelectContent>
                            {sheds.map((shed) => (
                              <SelectItem key={shed.id} value={shed.id}>
                                {shed.name} - {shed.farm.name}
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
                          onChange={(e) => setProductionForm({...productionForm, tableEggs: e.target.value})}
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
                          onChange={(e) => setProductionForm({...productionForm, hatchingEggs: e.target.value})}
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
                          onChange={(e) => setProductionForm({...productionForm, crackedEggs: e.target.value})}
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
                          onChange={(e) => setProductionForm({...productionForm, jumboEggs: e.target.value})}
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
                          onChange={(e) => setProductionForm({...productionForm, leakerEggs: e.target.value})}
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
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={productionForm.notes}
                        onChange={(e) => setProductionForm({...productionForm, notes: e.target.value})}
                        placeholder="Any additional notes..."
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsProductionDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Record Production</Button>
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
                      <TableHead>Shed</TableHead>
                      <TableHead>Table Eggs</TableHead>
                      <TableHead>Hatching Eggs</TableHead>
                      <TableHead>Cracked</TableHead>
                      <TableHead>Jumbo</TableHead>
                      <TableHead>Leaker</TableHead>
                      <TableHead>Total HD Eggs</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          Loading production records...
                        </TableCell>
                      </TableRow>
                    ) : productions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          No production records found. Record your first production!
                        </TableCell>
                      </TableRow>
                    ) : (
                      productions.map((production) => (
                        <TableRow key={production.id}>
                          <TableCell>{new Date(production.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{production.shed.name}</div>
                              <div className="text-sm text-gray-500">{production.shed.farm.name}</div>
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
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
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
                          onChange={(e) => setMortalityForm({...mortalityForm, date: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mortalityShed">Shed</Label>
                        <Select value={mortalityForm.shedId} onValueChange={(value) => setMortalityForm({...mortalityForm, shedId: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select shed" />
                          </SelectTrigger>
                          <SelectContent>
                            {sheds.map((shed) => (
                              <SelectItem key={shed.id} value={shed.id}>
                                {shed.name} - {shed.farm.name}
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
                          onChange={(e) => setMortalityForm({...mortalityForm, maleMortality: e.target.value})}
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
                          onChange={(e) => setMortalityForm({...mortalityForm, femaleMortality: e.target.value})}
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
                        onChange={(e) => setMortalityForm({...mortalityForm, notes: e.target.value})}
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
                      <div className="text-2xl font-bold text-blue-600">1,245</div>
                      <div className="text-sm text-gray-600">Male Chickens</div>
                    </div>
                    <div className="text-center p-3 bg-pink-50 rounded-lg">
                      <div className="text-2xl font-bold text-pink-600">4,890</div>
                      <div className="text-sm text-gray-600">Female Chickens</div>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800">6,135</div>
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
                        <TableHead>Shed</TableHead>
                        <TableHead>Male</TableHead>
                        <TableHead>Female</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Updated Counts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mortalityRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No mortality records found. Record your first mortality data!
                          </TableCell>
                        </TableRow>
                      ) : (
                        mortalityRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>Shed Name</TableCell>
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
                                <div>M: 1,245 | F: 4,890</div>
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
                          onChange={(e) => setDispatchForm({...dispatchForm, date: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dispatchShed">Shed</Label>
                        <Select value={dispatchForm.shedId} onValueChange={(value) => setDispatchForm({...dispatchForm, shedId: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select shed" />
                          </SelectTrigger>
                          <SelectContent>
                            {sheds.map((shed) => (
                              <SelectItem key={shed.id} value={shed.id}>
                                {shed.name} - {shed.farm.name}
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
                          onChange={(e) => setDispatchForm({...dispatchForm, tableEggs: e.target.value})}
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
                          onChange={(e) => setDispatchForm({...dispatchForm, hatchingEggs: e.target.value})}
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
                          onChange={(e) => setDispatchForm({...dispatchForm, crackedEggs: e.target.value})}
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
                          onChange={(e) => setDispatchForm({...dispatchForm, jumboEggs: e.target.value})}
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
                          onChange={(e) => setDispatchForm({...dispatchForm, leakerEggs: e.target.value})}
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
                        onChange={(e) => setDispatchForm({...dispatchForm, notes: e.target.value})}
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
                        <div className="text-xl font-bold text-blue-600">2,450</div>
                        <div className="text-sm text-gray-600">Table Eggs</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600">1,890</div>
                        <div className="text-sm text-gray-600">Hatching Eggs</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-yellow-50 rounded-lg">
                        <div className="text-lg font-bold text-yellow-600">150</div>
                        <div className="text-xs text-gray-600">Cracked</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">89</div>
                        <div className="text-xs text-gray-600">Jumbo</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded-lg">
                        <div className="text-lg font-bold text-red-600">45</div>
                        <div className="text-xs text-gray-600">Leaker</div>
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                      <div className="text-2xl font-bold text-gray-800">4,624</div>
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
                        <TableHead>Category</TableHead>
                        <TableHead>Dispatched</TableHead>
                        <TableHead>Remaining</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dispatchRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            No dispatch records found. Record your first dispatch!
                          </TableCell>
                        </TableRow>
                      ) : (
                        dispatchRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>Mixed</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                {record.totalDispatched}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">
                                Stock remaining
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
                      <div className="text-3xl font-bold text-green-600">1,890</div>
                      <div className="text-sm text-gray-600">Total Production</div>
                    </div>
                    <div className="text-center p-3 bg-green-100 rounded-lg">
                      <div className="text-xl font-bold text-green-700">1,200</div>
                      <div className="text-sm text-gray-600">Total Eggs Sold</div>
                    </div>
                    <div className="text-center p-3 bg-green-200 rounded-lg">
                      <div className="text-xl font-bold text-green-800">690</div>
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
                      <div className="text-3xl font-bold text-blue-600">4,624</div>
                      <div className="text-sm text-gray-600">Total Production</div>
                    </div>
                    <div className="text-center p-3 bg-blue-100 rounded-lg">
                      <div className="text-xl font-bold text-blue-700">2,800</div>
                      <div className="text-sm text-gray-600">Total Eggs Sold</div>
                    </div>
                    <div className="text-center p-3 bg-blue-200 rounded-lg">
                      <div className="text-xl font-bold text-blue-800">1,824</div>
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
                      <div className="text-xl font-bold text-purple-600">40.9%</div>
                      <div className="text-sm text-gray-600">HE/HD Ratio</div>
                    </div>
                    <div className="text-center p-3 bg-purple-100 rounded-lg">
                      <div className="text-xl font-bold text-purple-700">63.5%</div>
                      <div className="text-sm text-gray-600">HE Dispatch Rate</div>
                    </div>
                    <div className="text-center p-3 bg-purple-200 rounded-lg">
                      <div className="text-xl font-bold text-purple-800">60.6%</div>
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
                        const heDispatched = Math.floor(heProduction * 0.6) // Mock dispatch data
                        const hdDispatched = Math.floor(hdProduction * 0.6)
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