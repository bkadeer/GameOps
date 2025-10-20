-- Migration: Optimize table structure for payments and sessions
-- Date: 2025-10-19
-- Description: 
--   1. Remove completed_at from payments (not needed, use created_at)
--   2. Add station_name to sessions for human readability
--   3. Reorder columns for better organization

-- ============================================
-- Part 1: Payments table cleanup
-- ============================================

-- Remove completed_at column (use created_at instead)
ALTER TABLE payments
DROP COLUMN IF EXISTS completed_at;

-- Note: Column reordering in PostgreSQL requires recreating the table
-- Since we already have user_name in the correct position (after id), no action needed

-- ============================================
-- Part 2: Sessions table - Add station_name
-- ============================================

-- Add station_name column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS station_name VARCHAR(255);

-- Populate station_name from stations table for existing sessions
UPDATE sessions s
SET station_name = st.name
FROM stations st
WHERE s.station_id = st.id AND s.station_name IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_station_name ON sessions(station_name);

-- Add comment
COMMENT ON COLUMN sessions.station_name IS 'Name of the station for human readability';

-- ============================================
-- Verification
-- ============================================

-- Check payments table structure
-- SELECT column_name, data_type, ordinal_position 
-- FROM information_schema.columns 
-- WHERE table_name = 'payments' 
-- ORDER BY ordinal_position;

-- Check sessions table structure
-- SELECT column_name, data_type, ordinal_position 
-- FROM information_schema.columns 
-- WHERE table_name = 'sessions' 
-- ORDER BY ordinal_position;
