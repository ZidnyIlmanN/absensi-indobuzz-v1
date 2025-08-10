/*
  # Update Leave Requests for Date Range Support

  1. Schema Changes
    - Rename `leave_date` column to `start_date`
    - Add `end_date` column for date range support
    - Update indexes for better performance with date ranges
    - Add constraint to ensure end_date >= start_date

  2. Data Migration
    - Migrate existing single date records to date range format
    - Set end_date = start_date for existing records (single day leaves)

  3. Updated Indexes
    - Update existing indexes to work with new date range columns
    - Add new indexes for date range queries
*/

-- Step 1: Add new end_date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE leave_requests ADD COLUMN end_date date;
  END IF;
END $$;

-- Step 2: Migrate existing data (set end_date = leave_date for existing records)
UPDATE leave_requests 
SET end_date = leave_date 
WHERE end_date IS NULL AND leave_date IS NOT NULL;

-- Step 3: Rename leave_date to start_date
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'leave_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE leave_requests RENAME COLUMN leave_date TO start_date;
  END IF;
END $$;

-- Step 4: Make both dates required and add constraint
ALTER TABLE leave_requests ALTER COLUMN start_date SET NOT NULL;
ALTER TABLE leave_requests ALTER COLUMN end_date SET NOT NULL;

-- Add constraint to ensure end_date >= start_date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'leave_requests' AND constraint_name = 'leave_requests_date_range_check'
  ) THEN
    ALTER TABLE leave_requests 
    ADD CONSTRAINT leave_requests_date_range_check 
    CHECK (end_date >= start_date);
  END IF;
END $$;

-- Step 5: Update indexes for better performance
DROP INDEX IF EXISTS idx_leave_requests_date;

-- Create new indexes for date range queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date ON leave_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_end_date ON leave_requests(end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_date_range ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_date_range ON leave_requests(user_id, start_date, end_date);

-- Step 6: Add function to calculate leave duration in days
CREATE OR REPLACE FUNCTION calculate_leave_duration(start_date date, end_date date)
RETURNS integer AS $$
BEGIN
  RETURN (end_date - start_date) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 7: Add computed column for leave duration (optional, for reporting)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE leave_requests 
    ADD COLUMN duration_days integer GENERATED ALWAYS AS (calculate_leave_duration(start_date, end_date)) STORED;
  END IF;
END $$;

-- Step 8: Update RLS policies to work with new date columns
DROP POLICY IF EXISTS "Users can read own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can insert own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can update own pending leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Managers can review team requests" ON leave_requests;
DROP POLICY IF EXISTS "Managers can update team requests" ON leave_requests;

-- Recreate policies
CREATE POLICY "Users can read own leave requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leave requests"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending leave requests"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Managers can review team requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (position ILIKE '%manager%' OR position ILIKE '%supervisor%' OR position ILIKE '%hr%')
    )
  );

CREATE POLICY "Managers can update team requests"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (position ILIKE '%manager%' OR position ILIKE '%supervisor%' OR position ILIKE '%hr%')
    )
  );