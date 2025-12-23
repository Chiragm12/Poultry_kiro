"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface EggQualityData {
  sellableEggs: number
  brokenEggs: number
  damagedEggs: number
}

interface EggQualityChartProps {
  data: EggQualityData
  title?: string
  description?: string
  height?: number
}

const COLORS = {
  sellable: '#10b981',
  broken: '#f59e0b',
  damaged: '#ef4444'
}

export default function EggQualityChart({ 
  data, 
  title = "Egg Quality Distribution", 
  description = "Breakdown of sellable vs damaged eggs",
  height = 300 
}: EggQualityChartProps) {
  const total = data.sellableEggs + data.brokenEggs + data.damagedEggs
  
  const chartData = [
    {
      name: 'Sellable Eggs',
      value: data.sellableEggs,
      percentage: total > 0 ? (data.sellableEggs / total * 100).toFixed(1) : 0,
      color: COLORS.sellable
    },
    {
      name: 'Broken Eggs',
      value: data.brokenEggs,
      percentage: total > 0 ? (data.brokenEggs / total * 100).toFixed(1) : 0,
      color: COLORS.broken
    },
    {
      name: 'Damaged Eggs',
      value: data.damagedEggs,
      percentage: total > 0 ? (data.damagedEggs / total * 100).toFixed(1) : 0,
      color: COLORS.damaged
    }
  ].filter(item => item.value > 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value.toLocaleString()} eggs ({data.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null // Don't show label for slices smaller than 5%
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            No production data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center">
          <div className="w-full lg:w-2/3">
            <ResponsiveContainer width="100%" height={height}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="w-full lg:w-1/3 mt-4 lg:mt-0">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 mb-3">Summary</h4>
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{item.value.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{item.percentage}%</div>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm font-medium">
                  <span>Total Eggs</span>
                  <span>{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}