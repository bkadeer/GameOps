'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { RevenueData } from '@/types'
import { DollarSign } from 'lucide-react'
import { getTimezoneAbbreviation } from '@/lib/timezone'

interface RevenueChartProps {
  data: RevenueData | null
  period: 'day' | 'week' | 'month'
}

export default function RevenueChart({ data, period }: RevenueChartProps) {
  if (!data) return null

  // Get appropriate data based on period
  const chartData = period === 'day' ? data.hourly : period === 'week' ? data.daily : data.weekly
  
  // Format data for display
  let formattedData
  
  if (period === 'day') {
    // For hourly data, fill in all 24 hours even if no data
    const hourlyMap = new Map(chartData.map((item: any) => [item.hour, item]))
    formattedData = Array.from({ length: 24 }, (_, hour) => {
      const existingData = hourlyMap.get(hour)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return {
        hour,
        revenue: existingData?.revenue || 0,
        sessions: existingData?.sessions || 0,
        label: `${displayHour} ${ampm}`
      }
    })
  } else if (period === 'week') {
    // Daily data - format as "Mon 21", "Tue 22", etc.
    formattedData = chartData.map((item: any) => {
      const date = new Date(item.date)
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return {
        ...item,
        label: `${dayNames[date.getDay()]} ${date.getDate()}`
      }
    })
  } else {
    // Weekly data - format as "Week 42"
    formattedData = chartData.map((item: any) => ({
      ...item,
      label: item.week
    }))
  }

  return (
    <div className="relative group">
      <div className="bg-gradient-to-br from-[#1a1a1a] via-[#1e1e1e] to-[#1a1a1a] rounded-2xl p-6 border border-neutral-700/30 hover:border-emerald-500/30 transition-all duration-300 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-100">Revenue Trends</h3>
              <p className="text-sm text-gray-400">
                {period === 'day' ? `Hourly revenue for yesterday (${getTimezoneAbbreviation()})` : period === 'week' ? 'Daily revenue for the week' : 'Weekly revenue trends'}
              </p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: period === 'day' ? 40 : 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#333333" opacity={0.3} />
              
              <XAxis 
                dataKey="label"
                stroke="#666666"
                style={{ fontSize: '12px', fill: '#999999' }}
                tickLine={false}
                angle={period === 'day' ? -45 : 0}
                textAnchor={period === 'day' ? 'end' : 'middle'}
                height={period === 'day' ? 80 : 60}
              />
              
              <YAxis 
                stroke="#666666"
                style={{ fontSize: '12px', fill: '#999999' }}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}
                labelStyle={{ color: '#E5E5E5', fontWeight: 'bold', marginBottom: '8px' }}
                itemStyle={{ color: '#A0A0A0' }}
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') return [`$${value.toFixed(2)}`, 'Revenue']
                  return [value, 'Sessions']
                }}
              />
              
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
                formatter={(value) => <span style={{ color: '#E5E5E5', fontSize: '14px' }}>{value === 'revenue' ? 'Revenue' : 'Sessions'}</span>}
              />
              
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2}
                fill="url(#revenueGradient)"
                animationDuration={1000}
              />
              
              <Area 
                type="monotone" 
                dataKey="sessions" 
                stroke="#06b6d4" 
                strokeWidth={2}
                fill="url(#sessionsGradient)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
