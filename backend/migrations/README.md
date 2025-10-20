# Database Migrations

This directory contains SQL migration scripts for the GameOps database.

## Running Migrations

To apply a migration, connect to your PostgreSQL database and run:

```bash
psql -U your_username -d gameops -f migrations/migration_file.sql
```

Or using the Python backend:

```bash
cd backend
python -c "from app.core.database import engine; import asyncio; from sqlalchemy import text; asyncio.run(engine.connect().execute(text(open('migrations/migration_file.sql').read())))"
```

## Available Migrations

### 1. `add_timestamps_to_sessions.sql`
- **Date**: 2025-01-18
- **Description**: Adds `created_at` and `updated_at` timestamp columns to the sessions table
- **Status**: Applied

### 2. `add_soft_delete_to_stations.sql`
- **Date**: 2025-01-18  
- **Description**: Adds soft delete functionality to stations table
- **Status**: Applied

### 3. `add_station_to_payments_and_username_to_sessions.sql`
- **Date**: 2025-10-19
- **Description**: 
  - Adds `station_id` column to payments table for revenue tracking per station
  - Replaces `user_id` with `user_name` in sessions table for easier tracking
- **Status**: ✅ **APPLIED**

### 4. `update_payments_user_name.sql`
- **Date**: 2025-10-19
- **Description**: 
  - Replaces `user_id` with `user_name` in payments table to track who made payments
  - Migrates existing data from users table
- **Status**: ✅ **APPLIED**

### 5. `optimize_tables_structure.sql` ⭐ **NEW**
- **Date**: 2025-10-19
- **Description**: 
  - Removes `completed_at` from payments (use `created_at` instead)
  - Adds `station_name` to sessions for human readability
  - Populates station_name from stations table
- **Status**: ✅ **APPLIED**

## Migration Order

Migrations should be applied in chronological order:
1. add_timestamps_to_sessions.sql
2. add_soft_delete_to_stations.sql
3. add_station_to_payments_and_username_to_sessions.sql ⬅️ **Apply this next**

## Important Notes

### For Migration #3 (Station ID & User Name)

**Before running:**
1. Backup your database
2. Ensure no active sessions are running
3. Review the migration script

**What it does:**
- Adds `station_id` to payments table (nullable, with foreign key to stations)
- Migrates existing `user_id` data to `user_name` by copying usernames from users table
- Drops the `user_id` column from sessions table
- Adds indexes for better query performance

**After running:**
1. Restart the backend server
2. The frontend is already updated to use the new schema
3. Test creating a new session
4. Test extending a session
5. Verify revenue tracking per station works

**Revenue Tracking Query:**
```sql
-- Check revenue per station
SELECT 
    s.name as station_name,
    COUNT(p.id) as payment_count,
    SUM(p.amount) as total_revenue
FROM payments p
JOIN stations s ON p.station_id = s.id
WHERE p.status = 'COMPLETED'
GROUP BY s.id, s.name
ORDER BY total_revenue DESC;
```

## Rollback

If you need to rollback migration #3:

```sql
-- Add user_id back to sessions
ALTER TABLE sessions ADD COLUMN user_id UUID;
ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id);

-- Remove user_name from sessions
ALTER TABLE sessions DROP COLUMN user_name;

-- Remove station_id from payments
ALTER TABLE payments DROP COLUMN station_id;
```

⚠️ **Note**: Rollback will lose the user_name data that was stored!
