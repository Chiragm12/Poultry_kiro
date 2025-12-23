"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AttendanceData {
  userId: string
  userName: string
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  attendanceRate: number
}

interface AttendanceChartProps {
  data: AttendanceData[]
  title?: string
  description?: string
  height?: number
}

export default function AttendanceChart({ 
  data, 
  title = "Worker Attendance Summary", 
  description = "Attendance breakdown by worker",
  height = 300 
}: AttendanceChartProps) {
  const chartData = data.map(worker => ({
    name: worker.userName,
    present: worker.presentDays,
    late: worker.lateDays,
    absent: worker.absentDays,
    rate: worker.attendanceRate,
    total: worker.totalDays
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">
              Present: {data.present} days
            </p>
            <p className="text-yellow-600">
              Late: {data.late} days
            </p>
            <p className="text-red-600">
              Absent: {data.absent} days
            </p>
            <p className="text-blue-600 font-medium">
              Attendance Rate: {data.rate.toFixed(1)}%
            </p>
            <p className="text-gray-600 text-xs border-t pt-1">
              Total Days: {data.total}
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
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="present" 
              stackId="a"
              fill="#10b981" 
              name="Present"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="late" 
              stackId="a"
              fill="#f59e0b" 
              name="Late"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="absent" 
              stackId="a"
              fill="#ef4444" 
              name="Absent"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}