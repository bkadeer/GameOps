'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { SessionAnalytics } from '@/types'
import { Activity } from 'lucide-react'

interface SessionChartProps {
  data: SessionAnalytics | null
  period: 'day' | 'week' | 'month'
}

export default function SessionChart({ data, period }: SessionChartProps) {
  if (!data) return null

  const chartData = period === 'day' 
    ? data.hourly.map(h => ({ label: `${h.hour}:00`, count: h.count, revenue: h.revenue }))
    : data.daily.map(d => ({ label: d.date, count: d.count, duration: d.avg_duration }))

  return (
    <div className="relative group">
      <div className="bg-gradient-to-br from-[#1a1a1a] via-[#1e1e1e] to-[#1a1a1a] rounded-2xl p-6 border border-neutral-700/30 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-100">Session Analytics</h3>
              <p className="text-sm text-gray-400">
                {period === 'day' ? 'Hourly session distribution' : 'Daily session trends'}
              </p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="revenueBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
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
                  if (name === 'duration') return [`${value} min`, 'Avg Duration']
                  return [value, 'Sessions']
                }}
              />
              
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    count: 'Sessions',
                    revenue: 'Revenue',
                    duration: 'Avg Duration'
                  }
                  return <span style={{ color: '#E5E5E5', fontSize: '14px' }}>{labels[value] || value}</span>
                }}
              />
              
              <Bar 
                dataKey="count" 
                fill="url(#countGradient)"
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
              />
              
              {period === 'day' && (
                <Bar 
                  dataKey="revenue" 
                  fill="url(#revenueBarGradient)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
