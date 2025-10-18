-- Migration: Add soft delete support to stations table
-- Date: 2025-01-18
-- Description: Adds deleted_at column for soft delete functionality

-- Add deleted_at column
ALTER TABLE stations 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index on deleted_at for better query performance
CREATE INDEX idx_stations_deleted_at ON stations(deleted_at);

-- Add comment
COMMENT ON COLUMN stations.deleted_at IS 'Timestamp when station was soft deleted. NULL means not deleted.';
