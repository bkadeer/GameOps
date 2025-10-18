'use client'

import { Monitor, Gamepad2, Circle, Play } from 'lucide-react'
import type { Station } from '@/types'

interface StationGridProps {
  stations: Station[]
}

export default function StationGrid({ stations }: StationGridProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'text-green-500'
      case 'IN_SESSION':
        return 'text-[#ed6802]'
      case 'OFFLINE':
        return 'text-gray-500'
      case 'MAINTENANCE':
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-500/10 border-green-500/30'
      case 'IN_SESSION':
        return 'bg-[#ed6802]/10 border-[#ed6802]/30'
      case 'OFFLINE':
        return 'bg-gray-500/10 border-gray-500/30'
      case 'MAINTENANCE':
        return 'bg-yellow-500/10 border-yellow-500/30'
      default:
        return 'bg-gray-500/10 border-gray-500/30'
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'PC':
        return Monitor
      default:
        return Gamepad2
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {stations.map((station) => {
        const Icon = getIcon(station.station_type)
        return (
          <div
            key={station.id}
            className="bg-[#252525] rounded-2xl p-5 border border-[#333333] hover:border-[#ed6802]/50 transition-all duration-300 group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#2D2D2D] rounded-xl flex items-center justify-center group-hover:bg-[#ed6802]/10 transition-colors">
                  <Icon className="w-6 h-6 text-[#A0A0A0] group-hover:text-[#ed6802] transition-colors" />
                </div>
                <div>
                  <h3 className="text-[#E5E5E5] font-semibold">{station.name}</h3>
                  <p className="text-[#A0A0A0] text-sm">{station.station_type}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${getStatusBg(station.status)}`}>
                <Circle className={`w-2 h-2 fill-current ${getStatusColor(station.status)}`} />
                <span className={`text-xs font-medium ${getStatusColor(station.status)}`}>
                  {station.status}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#A0A0A0]">Location</span>
                <span className="text-[#E5E5E5]">{station.location}</span>
              </div>
              {station.specs && (
                <>
                  {station.specs.cpu && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#A0A0A0]">CPU</span>
                      <span className="text-[#E5E5E5] text-xs">{station.specs.cpu}</span>
                    </div>
                  )}
                  {station.specs.ram_gb && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#A0A0A0]">RAM</span>
                      <span className="text-[#E5E5E5]">{station.specs.ram_gb}GB</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {station.status === 'ONLINE' && (
              <button className="w-full mt-4 bg-[#ed6802] hover:bg-[#ff7a1a] text-white py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                Start Session
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
