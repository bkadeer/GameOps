/**
 * Timezone Utilities for Frontend
 * 
 * Handles timezone conversion and formatting for the UI
 * 
 * Options:
 * 1. USE_BACKEND_TIMEZONE = true: Force use backend timezone (CST)
 * 2. USE_BACKEND_TIMEZONE = false: Use browser's local timezone
 */

// Set to true to force backend timezone, false to use browser timezone
const USE_BACKEND_TIMEZONE = true

// Backend's default timezone (should match backend/app/core/timezone.py)
const BACKEND_TIMEZONE = 'America/Chicago' // CST/CDT

/**
 * Get the timezone to use for display
 */
export function getDisplayTimezone(): string {
  if (USE_BACKEND_TIMEZONE) {
    return BACKEND_TIMEZONE
  }
  // Use browser's timezone
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Convert UTC date string to display timezone
 */
export function convertToDisplayTimezone(utcDateString: string): Date {
  const date = new Date(utcDateString)
  return date
}

/**
 * Format date in display timezone
 */
export function formatDateTime(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const timezone = getDisplayTimezone()
  
  return new Intl.DateTimeFormat('en-US', {
    ...options,
    timeZone: timezone
  }).format(dateObj)
}

/**
 * Format date for display (short format)
 */
export function formatDate(date: Date | string): string {
  return formatDateTime(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  return formatDateTime(date, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })
}

/**
 * Get hour in display timezone (0-23)
 */
export function getHourInTimezone(date: Date | string): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const timezone = getDisplayTimezone()
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: timezone
  })
  
  return parseInt(formatter.format(dateObj))
}

/**
 * Get day of week in display timezone (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeekInTimezone(date: Date | string): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const timezone = getDisplayTimezone()
  
  // Create a date string in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  const parts = formatter.formatToParts(dateObj)
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  
  const localDate = new Date(`${year}-${month}-${day}T00:00:00`)
  return localDate.getDay()
}

/**
 * Get current time in display timezone
 */
export function getCurrentTimeInTimezone(): Date {
  return new Date()
}

/**
 * Get timezone abbreviation (e.g., "CST", "EST", "PST")
 */
export function getTimezoneAbbreviation(): string {
  const timezone = getDisplayTimezone()
  const date = new Date()
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short'
  })
  
  const parts = formatter.formatToParts(date)
  const tzName = parts.find(p => p.type === 'timeZoneName')?.value
  
  return tzName || timezone
}

/**
 * Get timezone offset string (e.g., "UTC-6", "UTC+1")
 */
export function getTimezoneOffset(): string {
  const timezone = getDisplayTimezone()
  const date = new Date()
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset'
  })
  
  const parts = formatter.formatToParts(date)
  const offset = parts.find(p => p.type === 'timeZoneName')?.value
  
  return offset || 'UTC'
}

/**
 * Check if currently in daylight saving time
 */
export function isDaylightSavingTime(): boolean {
  const date = new Date()
  const jan = new Date(date.getFullYear(), 0, 1)
  const jul = new Date(date.getFullYear(), 6, 1)
  
  const timezone = getDisplayTimezone()
  
  const janOffset = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset'
  }).formatToParts(jan).find(p => p.type === 'timeZoneName')?.value
  
  const julOffset = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset'
  }).formatToParts(jul).find(p => p.type === 'timeZoneName')?.value
  
  const currentOffset = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset'
  }).formatToParts(date).find(p => p.type === 'timeZoneName')?.value
  
  return currentOffset !== janOffset
}

/**
 * Format relative time (e.g., "2 hours ago", "in 5 minutes")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`
  
  return formatDate(dateObj)
}
