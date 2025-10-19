-- Migration: Add created_at and updated_at to sessions table
-- Date: 2025-01-18
-- Description: Adds timestamp tracking columns to sessions table

-- Add created_at column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS sessions_updated_at_trigger ON sessions;
CREATE TRIGGER sessions_updated_at_trigger
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_sessions_updated_at();

-- Add comments
COMMENT ON COLUMN sessions.created_at IS 'Timestamp when session record was created';
COMMENT ON COLUMN sessions.updated_at IS 'Timestamp when session record was last updated';
