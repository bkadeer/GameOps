-- Migration: Add station_id to payments and replace user_id with user_name in sessions
-- Date: 2025-10-19
-- Description: 
--   1. Add station_id to payments table to track revenue per station
--   2. Replace user_id with user_name in sessions table for easier tracking

-- ============================================
-- Part 1: Add station_id to payments table
-- ============================================

-- Add station_id column to payments
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS station_id UUID;

-- Add foreign key constraint
ALTER TABLE payments
ADD CONSTRAINT fk_payments_station_id 
FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_station_id ON payments(station_id);

-- Add comment
COMMENT ON COLUMN payments.station_id IS 'Station that generated this payment (for revenue tracking)';

-- ============================================
-- Part 2: Replace user_id with user_name in sessions
-- ============================================

-- Add user_name column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);

-- Migrate existing data: copy user names from users table to sessions
UPDATE sessions s
SET user_name = u.username
FROM users u
WHERE s.user_id = u.id AND s.user_name IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_name ON sessions(user_name);

-- Drop the old user_id foreign key constraint
ALTER TABLE sessions
DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;

-- Drop the old user_id column
ALTER TABLE sessions
DROP COLUMN IF EXISTS user_id;

-- Add comment
COMMENT ON COLUMN sessions.user_name IS 'Name of the user for this session (stored directly for easy tracking)';

-- ============================================
-- Verification queries (run these to verify)
-- ============================================

-- Check payments table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'payments' 
-- ORDER BY ordinal_position;

-- Check sessions table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'sessions' 
-- ORDER BY ordinal_position;

-- Check revenue per station
-- SELECT 
--     s.name as station_name,
--     COUNT(p.id) as payment_count,
--     SUM(p.amount) as total_revenue
-- FROM payments p
-- JOIN stations s ON p.station_id = s.id
-- WHERE p.status = 'COMPLETED'
-- GROUP BY s.id, s.name
-- ORDER BY total_revenue DESC;
