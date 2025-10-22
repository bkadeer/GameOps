'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { PeakHoursData } from '@/types'
import { Clock } from 'lucide-react'

interface PeakHoursHeatmapProps {
  data: PeakHoursData | null
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function PeakHoursHeatmap({ data }: PeakHoursHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!data || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 20, bottom: 60, left: 60 }
    const width = 600 - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Scales
    const xScale = d3.scaleBand()
      .domain(HOURS.map(String))
      .range([0, width])
      .padding(0.05)

    const yScale = d3.scaleBand()
      .domain(DAYS)
      .range([0, height])
      .padding(0.05)

    const maxValue = d3.max(data.heatmap, d => d.value) || 1
    const colorScale = d3.scaleSequential()
      .domain([0, maxValue])
      .interpolator(d3.interpolateRgb('#1a1a1a', '#10b981'))

    // Create heatmap cells
    const cells = g.selectAll('rect')
      .data(data.heatmap)
      .enter()
      .append('rect')
      .attr('x', d => xScale(String(d.hour)) || 0)
      .attr('y', d => yScale(DAYS[d.day]) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', '#1a1a1a')
      .attr('rx', 4)
      .attr('ry', 4)
      .style('cursor', 'pointer')

    // Animate cells
    cells.transition()
      .duration(1000)
      .delay((d, i) => i * 5)
      .attr('fill', d => colorScale(d.value))

    // Add hover effects
    cells
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.8)
          .attr('stroke', '#10b981')
          .attr('stroke-width', 2)

        // Show tooltip
        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'heatmap-tooltip')
          .style('position', 'absolute')
          .style('background', '#1a1a1a')
          .style('border', '1px solid #333')
          .style('border-radius', '8px')
          .style('padding', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .style('box-shadow', '0 10px 40px rgba(0,0,0,0.5)')
          .html(`
            <div style="color: #E5E5E5; font-weight: bold; margin-bottom: 4px;">
              ${DAYS[d.day]} ${d.hour}:00
            </div>
            <div style="color: #10b981; font-size: 14px;">
              ${d.value} sessions
            </div>
          `)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('stroke', 'none')

        d3.selectAll('.heatmap-tooltip').remove()
      })

    // X-axis (hours)
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickValues(HOURS.filter(h => h % 3 === 0).map(String)))
      .selectAll('text')
      .style('fill', '#999')
      .style('font-size', '11px')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')

    // Y-axis (days)
    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('fill', '#999')
      .style('font-size', '12px')

    // Remove axis lines
    g.selectAll('.domain').remove()
    g.selectAll('.tick line').remove()

    // Cleanup
    return () => {
      d3.selectAll('.heatmap-tooltip').remove()
    }
  }, [data])

  if (!data) return null

  return (
    <div className="relative group">
      <div className="bg-gradient-to-br from-[#1a1a1a] via-[#1e1e1e] to-[#1a1a1a] rounded-2xl p-6 border border-neutral-700/30 hover:border-amber-500/30 transition-all duration-300 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-100">Peak Hours Heatmap</h3>
              <p className="text-sm text-gray-400">Busiest times of the week</p>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="flex justify-center">
          <svg
            ref={svgRef}
            width={600}
            height={300}
            className="overflow-visible"
          />
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#1a1a1a]" />
            <span className="text-xs text-gray-400">Low Activity</span>
          </div>
          <div className="flex-1 mx-4 h-2 rounded-full bg-gradient-to-r from-[#1a1a1a] via-emerald-500/50 to-emerald-500" />
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <span className="text-xs text-gray-400">High Activity</span>
          </div>
        </div>

        {/* Peak Info */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-neutral-900/30 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Busiest Day</p>
            <p className="text-lg font-bold text-emerald-400">{data.peak_day}</p>
          </div>
          <div className="bg-neutral-900/30 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Peak Hour</p>
            <p className="text-lg font-bold text-amber-400">{data.peak_hour}:00</p>
          </div>
        </div>
      </div>
    </div>
  )
}
