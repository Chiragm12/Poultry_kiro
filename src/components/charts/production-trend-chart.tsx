"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format, parseISO } from 'date-fns'

interface ProductionTrendData {
  date: string
  totalEggs: number
  sellableEggs: number
  normalEggs: number
  commEggs: number
  waterEggs: number
  jellyEggs: number
  creakEggs: number
  leakerEggs: number
  wasteEggs: number
  brokenEggs: number // Keep for backward compatibility
  damagedEggs: number // Keep for backward compatibility
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
      const data = payload[0]?.payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{formatTooltipDate(label)}</p>
          <div className="space-y-1">
            <p className="text-sm text-blue-600">
              Total Eggs: {data?.totalEggs?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-green-600">
              Sellable: {data?.sellableEggs?.toLocaleString() || 0}
            </p>
            {data?.normalEggs > 0 && (
              <p className="text-xs text-green-500 ml-2">
                • Normal: {data.normalEggs.toLocaleString()}
              </p>
            )}
            {data?.commEggs > 0 && (
              <p className="text-xs text-blue-500 ml-2">
                • Commercial: {data.commEggs.toLocaleString()}
              </p>
            )}
            <p className="text-sm text-red-600">
              Waste: {data?.wasteEggs?.toLocaleString() || 0}
            </p>
            {data?.waterEggs > 0 && (
              <p className="text-xs text-cyan-500 ml-2">
                • Water: {data.waterEggs.toLocaleString()}
              </p>
            )}
            {data?.jellyEggs > 0 && (
              <p className="text-xs text-amber-500 ml-2">
                • Jelly: {data.jellyEggs.toLocaleString()}
              </p>
            )}
            {data?.creakEggs > 0 && (
              <p className="text-xs text-red-500 ml-2">
                • Creak: {data.creakEggs.toLocaleString()}
              </p>
            )}
            {data?.leakerEggs > 0 && (
              <p className="text-xs text-red-600 ml-2">
                • Leaker: {data.leakerEggs.toLocaleString()}
              </p>
            )}
          </div>
          {data?.totalEggs > 0 && (
            <div className="mt-2 pt-2 border-t text-xs text-gray-500">
              <p>Efficiency: {((data.sellableEggs / data.totalEggs) * 100).toFixed(1)}%</p>
              <p>Waste Rate: {((data.wasteEggs || 0) / data.totalEggs * 100).toFixed(1)}%</p>
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
              dataKey="wasteEggs" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Waste Eggs"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}