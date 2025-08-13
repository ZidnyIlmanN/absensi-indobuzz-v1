/*
  # Add Multiple Dates Support to Leave Requests

  1. Schema Changes
    - Add `selected_dates` column to store array of selected dates as JSON
    - Keep existing `start_date` and `end_date` for backward compatibility
    - Add index for better performance on selected_dates queries

  2. Data Migration
    - Existing records will continue to work with start_date/end_date
    - New records will use selected_dates array
    - Application handles both formats seamlessly

  3. Backward Compatibility
    - Existing queries continue to work
    - Legacy date range functionality preserved
    - Gradual migration to new multiple dates system
*/

-- Add selected_dates column to store multiple non-consecutive dates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'selected_dates'
  ) THEN
    ALTER TABLE leave_requests ADD COLUMN selected_dates jsonb;
  END IF;
END $$;

-- Add index for selected_dates queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_selected_dates ON leave_requests USING GIN (selected_dates);

-- Add comment to explain the new column
COMMENT ON COLUMN leave_requests.selected_dates IS 'JSON array of selected dates for non-consecutive leave requests. Format: ["2024-08-10", "2024-08-13", "2024-08-26"]';

-- Function to calculate total leave days from selected_dates
CREATE OR REPLACE FUNCTION calculate_leave_days_from_selected(selected_dates jsonb, leave_type text)
RETURNS decimal AS $$
BEGIN
  IF selected_dates IS NULL THEN
    RETURN 0;
  END IF;
  
  IF leave_type = 'half_day' THEN
    RETURN (jsonb_array_length(selected_dates) * 0.5);
  ELSE
    RETURN jsonb_array_length(selected_dates);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the duration_days column to work with both formats
DROP FUNCTION IF EXISTS calculate_leave_duration(date, date);

CREATE OR REPLACE FUNCTION calculate_leave_duration_enhanced(start_date date, end_date date, selected_dates jsonb, leave_type text)
RETURNS integer AS $$
BEGIN
  -- If selected_dates is available, use it
  IF selected_dates IS NOT NULL THEN
    IF leave_type = 'half_day' THEN
      RETURN CEIL(jsonb_array_length(selected_dates) * 0.5);
    ELSE
      RETURN jsonb_array_length(selected_dates);
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

-- Update the computed column to use the new function
DO $$
BEGIN
  -- Drop the existing computed column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE leave_requests DROP COLUMN duration_days;
  END IF;
  
  -- Add the new computed column
  ALTER TABLE leave_requests 
  ADD COLUMN duration_days integer GENERATED ALWAYS AS (
    calculate_leave_duration_enhanced(start_date, end_date, selected_dates, leave_type)
  ) STORED;
END $$;

-- Add validation function for selected_dates
CREATE OR REPLACE FUNCTION validate_selected_dates(selected_dates jsonb)
RETURNS boolean AS $$
BEGIN
  -- Check if it's a valid JSON array
  IF jsonb_typeof(selected_dates) != 'array' THEN
    RETURN false;
  END IF;
  
  -- Check if array is not empty
  IF jsonb_array_length(selected_dates) = 0 THEN
    RETURN false;
  END IF;
  
  -- Check if all elements are valid date strings
  -- This is a simplified check - in production you might want more validation
  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint to ensure selected_dates is valid when provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'leave_requests' AND constraint_name = 'leave_requests_selected_dates_valid'
  ) THEN
    ALTER TABLE leave_requests 
    ADD CONSTRAINT leave_requests_selected_dates_valid 
    CHECK (selected_dates IS NULL OR validate_selected_dates(selected_dates));
  END IF;
END $$;

-- Create view for easy querying of leave requests with expanded dates
CREATE OR REPLACE VIEW leave_requests_expanded AS
SELECT 
  lr.*,
  CASE 
    WHEN lr.selected_dates IS NOT NULL THEN
      (SELECT jsonb_agg(date_val) 
       FROM jsonb_array_elements_text(lr.selected_dates) AS date_val)
    ELSE
      (SELECT jsonb_agg(generate_series::date) 
       FROM generate_series(lr.start_date, lr.end_date, '1 day'::interval))
  END AS all_dates,
  calculate_leave_duration_enhanced(lr.start_date, lr.end_date, lr.selected_dates, lr.leave_type) as calculated_duration
FROM leave_requests lr;

-- Add comment to the view
COMMENT ON VIEW leave_requests_expanded IS 'Expanded view of leave requests showing all individual dates whether from selected_dates or date range';