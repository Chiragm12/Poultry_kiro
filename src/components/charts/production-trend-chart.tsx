"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format, parseISO } from 'date-fns'

interface ProductionTrendData {
  date: string
  totalEggs: number
  sellableEggs: number
  brokenEggs: number
  damagedEggs: number
}

interface ProductionTrendChartProps {
  data: ProductionTrendData[]
  title?: string
  description?: string
  height?: number
}

export default function ProductionTrendChart({ 
  data, 
  title = "Production Trend", 
  description = "30-day egg production overview",
  height = 300 
}: ProductionTrendChartProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd')
    } catch {
      return dateString
    }
  }

  const formatTooltipDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy')
    } catch {
      return dateString
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{formatTooltipDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()} eggs
            </p>
          ))}
          {payload.length > 0 && (
            <div className="mt-2 pt-2 border-t text-xs text-gray-500">
              <p>Loss Rate: {((payload[2]?.value + payload[3]?.value) / payload[0]?.value * 100).toFixed(1)}%</p>
            </div>
          )}
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
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="totalEggs" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Total Eggs"
              dot={{ r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="sellableEggs" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Sellable Eggs"
              dot={{ r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="brokenEggs" 
              stroke="#f59e0b" 
              strokeWidth={1}
              strokeDasharray="5 5"
              name="Broken Eggs"
              dot={{ r: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="damagedEggs" 
              stroke="#ef4444" 
              strokeWidth={1}
              strokeDasharray="5 5"
              name="Damaged Eggs"
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}