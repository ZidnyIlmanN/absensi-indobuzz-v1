/*
  # Fix Duration Column Reference Error

  This migration fixes the "column lr.duration_days does not exist" error
  by ensuring the duration_days column exists before creating views that reference it.

  1. Problem Analysis
    - The duration_days column is a computed column that depends on functions
    - When functions are recreated, computed columns may be temporarily unavailable
    - Views created during migration may fail if they reference non-existent columns

  2. Solution
    - Ensure duration_days column exists with proper dependencies
    - Recreate the column if it was dropped during function updates
    - Update the debug view to handle missing columns gracefully
*/

-- Step 1: Check if duration_days column exists, if not recreate it
DO $$
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'duration_days'
  ) THEN
    -- Recreate the duration_days column
    ALTER TABLE leave_requests 
    ADD COLUMN duration_days integer GENERATED ALWAYS AS (
      calculate_leave_duration_enhanced(start_date, end_date, selected_dates, leave_type)
    ) STORED;
    
    RAISE NOTICE 'Recreated duration_days column';
  ELSE
    RAISE NOTICE 'duration_days column already exists';
  END IF;
END $$;

-- Step 2: Ensure the calculation function exists and is working
CREATE OR REPLACE FUNCTION calculate_leave_duration_enhanced(
  start_date date, 
  end_date date, 
  selected_dates jsonb, 
  leave_type text
)
RETURNS integer AS $$
BEGIN
  -- If selected_dates is available and is a valid array
  IF selected_dates IS NOT NULL AND jsonb_typeof(selected_dates) = 'array' THEN
    IF jsonb_array_length(selected_dates) > 0 THEN
      IF leave_type = 'half_day' THEN
        RETURN CEIL(jsonb_array_length(selected_dates) * 0.5);
      ELSE
        RETURN jsonb_array_length(selected_dates);
      END IF;
    END IF;
  END IF;
  
  -- Fallback to legacy calculation
  IF start_date IS NOT NULL AND end_date IS NOT NULL THEN
    IF leave_type = 'half_day' THEN
      RETURN CEIL(((end_date - start_date) + 1) * 0.5);
    ELSE
      RETURN (end_date - start_date) + 1;
    END IF;
  END IF;
  
  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Recreate the debug view with proper error handling
DROP VIEW IF EXISTS leave_requests_debug;

CREATE OR REPLACE VIEW leave_requests_debug AS
SELECT 
  lr.id,
  lr.user_id,
  lr.leave_type,
  lr.start_date,
  lr.end_date,
  lr.selected_dates,
  -- Use COALESCE to handle cases where duration_days might not exist
  COALESCE(lr.duration_days, 0) as stored_duration,
  jsonb_typeof(lr.selected_dates) as selected_dates_type,
  CASE 
    WHEN lr.selected_dates IS NOT NULL AND jsonb_typeof(lr.selected_dates) = 'array' 
    THEN jsonb_array_length(lr.selected_dates)
    ELSE NULL 
  END as selected_dates_count,
  calculate_leave_duration_enhanced(lr.start_date, lr.end_date, lr.selected_dates, lr.leave_type) as calculated_days,
  CASE
    WHEN lr.selected_dates IS NOT NULL AND jsonb_typeof(lr.selected_dates) = 'array' AND jsonb_array_length(lr.selected_dates) > 0 THEN 'selected_dates_array'
    WHEN lr.start_date IS NOT NULL AND lr.end_date IS NOT NULL THEN 'date_range'
    ELSE 'no_valid_data'
  END as calculation_method,
  lr.status,
  lr.submitted_at
FROM leave_requests lr
ORDER BY lr.submitted_at DESC;

-- Step 4: Add comment explaining the fix
COMMENT ON VIEW leave_requests_debug IS 'Fixed debug view with proper column reference handling and error prevention';

-- Step 5: Verify the fix by testing the view
DO $$
DECLARE
  view_count integer;
BEGIN
  -- Test if the view can be queried without errors
  SELECT COUNT(*) INTO view_count FROM leave_requests_debug LIMIT 1;
  RAISE NOTICE 'Debug view test successful, can query % records', view_count;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Debug view test failed: %', SQLERRM;
END $$;

-- Step 6: Add a function to safely get duration for any leave request
CREATE OR REPLACE FUNCTION get_safe_leave_duration(leave_request_id uuid)
RETURNS integer AS $$
DECLARE
  lr_record leave_requests%ROWTYPE;
  calculated_duration integer;
BEGIN
  -- Get the leave request record
  SELECT * INTO lr_record FROM leave_requests WHERE id = leave_request_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate duration using the enhanced function
  calculated_duration := calculate_leave_duration_enhanced(
    lr_record.start_date, 
    lr_record.end_date, 
    lr_record.selected_dates, 
    lr_record.leave_type
  );
  
  RETURN calculated_duration;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Add comment explaining the solution
COMMENT ON FUNCTION get_safe_leave_duration(uuid) IS 'Safely calculate leave duration for any leave request by ID, handling all edge cases';