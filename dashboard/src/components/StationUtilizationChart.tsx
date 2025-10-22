'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { StationUtilization } from '@/types'
import { Monitor } from 'lucide-react'

interface StationUtilizationChartProps {
  data: StationUtilization | null
}

const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316']

export default function StationUtilizationChart({ data }: StationUtilizationChartProps) {
  if (!data) return null

  const chartData = data.stations.map(station => ({
    name: station.name,
    value: station.utilization_percent,
    sessions: station.total_sessions,
    revenue: station.revenue
  }))

  return (
    <div className="relative group">
      <div className="bg-gradient-to-br from-[#1a1a1a] via-[#1e1e1e] to-[#1a1a1a] rounded-2xl p-6 border border-neutral-700/30 hover:border-violet-500/30 transition-all duration-300 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-100">Station Utilization</h3>
              <p className="text-sm text-gray-400">Usage distribution by station</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{data.overall_utilization.toFixed(1)}%</p>
            <p className="text-xs text-gray-400">Overall</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                animationDuration={1000}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}
                labelStyle={{ color: '#E5E5E5', fontWeight: 'bold', marginBottom: '8px' }}
                formatter={(value: number, name: string, props: any) => {
                  if (name === 'value') {
                    return [
                      <div key="tooltip" className="space-y-1">
                        <div className="text-gray-300">{value.toFixed(1)}% Utilization</div>
                        <div className="text-gray-400 text-sm">{props.payload.sessions} sessions</div>
                        <div className="text-emerald-400 text-sm">${props.payload.revenue.toFixed(2)} revenue</div>
                      </div>,
                      ''
                    ]
                  }
                  return [value, name]
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Station List */}
        <div className="mt-6 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
          {data.stations.map((station, index) => (
            <div 
              key={station.id}
              className="flex items-center justify-between p-3 bg-neutral-900/30 rounded-lg hover:bg-neutral-900/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-gray-300">{station.name}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-400">{station.total_sessions} sessions</span>
                <span className="text-emerald-400 font-semibold">${station.revenue.toFixed(2)}</span>
                <span className="text-white font-bold min-w-[50px] text-right">{station.utilization_percent.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
