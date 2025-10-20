-- Migration: Replace user_id with user_name in payments table
-- Date: 2025-10-19
-- Description: Track who made payments using user_name instead of user_id

-- Add user_name column
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);

-- Migrate existing data: copy user names from users table to payments
UPDATE payments p
SET user_name = u.username
FROM users u
WHERE p.user_id = u.id AND p.user_name IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_user_name ON payments(user_name);

-- Drop the old user_id foreign key constraint
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

-- Drop the old user_id column
ALTER TABLE payments
DROP COLUMN IF EXISTS user_id;

-- Add comment
COMMENT ON COLUMN payments.user_name IS 'Name of the user who made this payment';
