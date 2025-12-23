"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ShedPerformanceData {
  shedId: string
  shedName: string
  farmName: string
  totalProduction: number
  averageDaily: number
  efficiency: number
  capacity: number
}

interface ShedPerformanceChartProps {
  data: ShedPerformanceData[]
  title?: string
  description?: string
  height?: number
}

export default function ShedPerformanceChart({ 
  data, 
  title = "Shed Performance Comparison", 
  description = "Production efficiency by shed",
  height = 300 
}: ShedPerformanceChartProps) {
  // Prepare data for chart
  const chartData = data.map(shed => ({
    name: `${shed.shedName} (${shed.farmName})`,
    production: shed.totalProduction,
    efficiency: shed.efficiency,
    capacity: shed.capacity,
    averageDaily: shed.averageDaily,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">
              Total Production: {data.production.toLocaleString()} eggs
            </p>
            <p className="text-green-600">
              Daily Average: {data.averageDaily.toLocaleString()} eggs
            </p>
            <p className="text-purple-600">
              Efficiency: {data.efficiency.toFixed(1)}%
            </p>
            <p className="text-gray-600">
              Capacity: {data.capacity.toLocaleString()} birds
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="production" 
              fill="#3b82f6" 
              name="Total Production"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              yAxisId="right"
              dataKey="efficiency" 
              fill="#10b981" 
              name="Efficiency %"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}