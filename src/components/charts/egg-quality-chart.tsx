"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface EggQualityData {
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

interface EggQualityChartProps {
  data: EggQualityData
  title?: string
  description?: string
  height?: number
}

const COLORS = {
  normal: '#10b981',      // Green for normal eggs
  commercial: '#3b82f6',  // Blue for commercial eggs
  water: '#06b6d4',       // Cyan for water eggs
  jelly: '#f59e0b',       // Amber for jelly eggs
  creak: '#ef4444',       // Red for creak eggs
  leaker: '#dc2626',      // Dark red for leaker eggs
  sellable: '#10b981',    // Keep for backward compatibility
  broken: '#f59e0b',      // Keep for backward compatibility
  damaged: '#ef4444'      // Keep for backward compatibility
}

export default function EggQualityChart({ 
  data, 
  title = "Egg Quality Distribution", 
  description = "Breakdown of egg categories and quality",
  height = 300 
}: EggQualityChartProps) {
  const total = data.normalEggs + data.commEggs + data.waterEggs + data.jellyEggs + 
                data.creakEggs + data.leakerEggs + data.brokenEggs + data.damagedEggs
  
  const chartData = [
    {
      name: 'Normal Eggs',
      value: data.normalEggs,
      percentage: total > 0 ? (data.normalEggs / total * 100).toFixed(1) : 0,
      color: COLORS.normal,
      category: 'sellable'
    },
    {
      name: 'Commercial Eggs',
      value: data.commEggs,
      percentage: total > 0 ? (data.commEggs / total * 100).toFixed(1) : 0,
      color: COLORS.commercial,
      category: 'sellable'
    },
    {
      name: 'Water Eggs',
      value: data.waterEggs,
      percentage: total > 0 ? (data.waterEggs / total * 100).toFixed(1) : 0,
      color: COLORS.water,
      category: 'waste'
    },
    {
      name: 'Jelly Eggs',
      value: data.jellyEggs,
      percentage: total > 0 ? (data.jellyEggs / total * 100).toFixed(1) : 0,
      color: COLORS.jelly,
      category: 'waste'
    },
    {
      name: 'Creak Eggs',
      value: data.creakEggs,
      percentage: total > 0 ? (data.creakEggs / total * 100).toFixed(1) : 0,
      color: COLORS.creak,
      category: 'waste'
    },
    {
      name: 'Leaker Eggs',
      value: data.leakerEggs,
      percentage: total > 0 ? (data.leakerEggs / total * 100).toFixed(1) : 0,
      color: COLORS.leaker,
      category: 'waste'
    }
  ].filter(item => item.value > 0)

  // Add backward compatibility data if new categories are empty
  if (chartData.length === 0 && (data.brokenEggs > 0 || data.damagedEggs > 0 || data.sellableEggs > 0)) {
    chartData.push(
      {
        name: 'Sellable Eggs',
        value: data.sellableEggs,
        percentage: total > 0 ? (data.sellableEggs / total * 100).toFixed(1) : 0,
        color: COLORS.sellable,
        category: 'sellable'
      },
      {
        name: 'Broken Eggs',
        value: data.brokenEggs,
        percentage: total > 0 ? (data.brokenEggs / total * 100).toFixed(1) : 0,
        color: COLORS.broken,
        category: 'waste'
      },
      {
        name: 'Damaged Eggs',
        value: data.damagedEggs,
        percentage: total > 0 ? (data.damagedEggs / total * 100).toFixed(1) : 0,
        color: COLORS.damaged,
        category: 'waste'
      }
    )
  }

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
              
              {/* Sellable eggs summary */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-green-700 mb-2">Sellable Eggs</h5>
                {chartData.filter(item => item.category === 'sellable').map((item, index) => (
                  <div key={index} className="flex items-center justify-between mb-1">
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
              </div>

              {/* Waste eggs summary */}
              {chartData.some(item => item.category === 'waste') && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-red-700 mb-2">Waste Eggs</h5>
                  {chartData.filter(item => item.category === 'waste').map((item, index) => (
                    <div key={index} className="flex items-center justify-between mb-1">
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
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm font-medium">
                  <span>Total Eggs</span>
                  <span>{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Sellable Rate</span>
                  <span>{total > 0 ? ((data.normalEggs + data.commEggs) / total * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}