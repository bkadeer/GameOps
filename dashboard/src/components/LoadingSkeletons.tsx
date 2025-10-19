'use client'

export function StatsCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, index) => (
        <div
          key={index}
          className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-6 border border-neutral-700/40 overflow-hidden animate-pulse"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-neutral-700/50"></div>
          
          <div className="relative z-10">
            {/* Icon skeleton */}
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-neutral-800/60"></div>
            </div>
            
            {/* Title and value skeleton */}
            <div>
              <div className="h-4 w-32 bg-neutral-800/60 rounded mb-2"></div>
              <div className="h-10 w-24 bg-neutral-800/60 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function StationCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, index) => (
        <div
          key={index}
          className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-6 border border-neutral-700/40 overflow-hidden animate-pulse"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="relative z-10">
            {/* Header skeleton */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-neutral-800/60"></div>
                <div>
                  <div className="h-5 w-24 bg-neutral-800/60 rounded mb-2"></div>
                  <div className="h-4 w-16 bg-neutral-800/60 rounded"></div>
                </div>
              </div>
              <div className="h-8 w-20 bg-neutral-800/60 rounded-full"></div>
            </div>

            {/* Specs section skeleton */}
            <div className="space-y-3 p-5 bg-neutral-950/50 rounded-xl border border-neutral-800/50">
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 bg-neutral-800/60 rounded"></div>
                <div className="h-4 w-32 bg-neutral-800/60 rounded"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-16 bg-neutral-800/60 rounded"></div>
                <div className="h-4 w-40 bg-neutral-800/60 rounded"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-16 bg-neutral-800/60 rounded"></div>
                <div className="h-4 w-20 bg-neutral-800/60 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SessionsListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl p-4 border border-neutral-700/40 animate-pulse"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-neutral-800/60"></div>
              <div className="flex-1">
                <div className="h-5 w-32 bg-neutral-800/60 rounded mb-2"></div>
                <div className="h-4 w-48 bg-neutral-800/60 rounded"></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-24 bg-neutral-800/60 rounded-full"></div>
              <div className="h-9 w-9 rounded-lg bg-neutral-800/60"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
