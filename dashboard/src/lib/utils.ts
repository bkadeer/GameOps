import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// Timezone utilities
export const CENTRAL_TIMEZONE = 'America/Chicago'

export function formatDateTime(date: string | Date, includeSeconds: boolean = false): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CENTRAL_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
    hour12: true,
  }).format(d)
}

export function formatTime(date: string | Date, includeSeconds: boolean = false): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CENTRAL_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
    hour12: true,
  }).format(d)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CENTRAL_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}
