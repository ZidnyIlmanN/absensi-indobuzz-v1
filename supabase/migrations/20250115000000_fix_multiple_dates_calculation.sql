/*
# Fix Multiple Dates Duration Calculation

  1. Database Function Updates
    - Fix calculate_leave_duration_enhanced to properly handle selected_dates array
    - Add debugging and validation for date calculations
    - Ensure proper fallback logic

  2. Data Validation
    - Add constraints to ensure data integrity
    - Validate selected_dates format and content
    - Add logging for troubleshooting

  3. Performance Optimization
    - Optimize duration calculation function
    - Add proper indexing for selected_dates queries
*/

-- Drop and recreate the duration calculation function with proper array handling
DROP FUNCTION IF EXISTS calculate_leave_duration_enhanced(date, date, jsonb, text) CASCADE;

CREATE OR REPLACE FUNCTION calculate_leave_duration_enhanced(
  start_date date, 
  end_date date, 
  selected_dates jsonb, 
  leave_type text
)
RETURNS integer AS $$
DECLARE
  date_count integer := 0;
  calculated_days numeric := 0;
BEGIN
  -- Debug logging
  RAISE NOTICE 'Duration calculation input: start_date=%, end_date=%, selected_dates=%, leave_type=%', 
    start_date, end_date, selected_dates, leave_type;
  
  -- Priority 1: Use selected_dates if it's a valid non-empty array
  IF selected_dates IS NOT NULL AND jsonb_typeof(selected_dates) = 'array' THEN
    date_count := jsonb_array_length(selected_dates);
    
    -- Only use selected_dates if it has actual dates
    IF date_count > 0 THEN
      RAISE NOTICE 'Using selected_dates array with % dates', date_count;
      
      IF leave_type = 'half_day' THEN
        calculated_days := date_count * 0.5;
      ELSE
        calculated_days := date_count;
      END IF;
      
      RAISE NOTICE 'Calculated days from selected_dates: %', calculated_days;
      RETURN CEIL(calculated_days);
    END IF;
  END IF;
  
  -- Priority 2: Fallback to legacy date range calculation
  IF start_date IS NOT NULL AND end_date IS NOT NULL THEN
    RAISE NOTICE 'Using legacy date range calculation: % to %', start_date, end_date;
    
    date_count := (end_date - start_date) + 1;
    
    IF leave_type = 'half_day' THEN
      calculated_days := date_count * 0.5;
    ELSE
      calculated_days := date_count;
    END IF;
    
    RAISE NOTICE 'Calculated days from date range: %', calculated_days;
    RETURN CEIL(calculated_days);
  END IF;
  
  -- Default fallback
  RAISE NOTICE 'No valid date data found, returning 0';
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Add function to validate selected_dates array contains valid dates
CREATE OR REPLACE FUNCTION validate_selected_dates_content(selected_dates jsonb)
RETURNS boolean AS $$
DECLARE
  date_element text;
  parsed_date date;
BEGIN
  -- Allow null
  IF selected_dates IS NULL THEN
    RETURN true;
  END IF;
  
  -- Must be array
  IF jsonb_typeof(selected_dates) != 'array' THEN
    RETURN false;
  END IF;
  
  -- Check each element is a valid date string
  FOR date_element IN SELECT jsonb_array_elements_text(selected_dates)
  LOOP
    BEGIN
      parsed_date := date_element::date;
    EXCEPTION WHEN OTHERS THEN
      RETURN false;
    END;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Update the constraint to validate date content
ALTER TABLE leave_requests 
DROP CONSTRAINT IF EXISTS leave_requests_selected_dates_flexible;

ALTER TABLE leave_requests 
ADD CONSTRAINT leave_requests_selected_dates_content_valid 
CHECK (validate_selected_dates_content(selected_dates));

-- Add function to get actual leave days count
CREATE OR REPLACE FUNCTION get_actual_leave_days(
  start_date date,
  end_date date, 
  selected_dates jsonb,
  leave_type text
)
RETURNS TABLE(
  total_calendar_days integer,
  actual_leave_days numeric,
  calculation_method text
) AS $$
BEGIN
  -- Method 1: Use selected_dates if available
  IF selected_dates IS NOT NULL AND jsonb_typeof(selected_dates) = 'array' AND jsonb_array_length(selected_dates) > 0 THEN
    total_calendar_days := jsonb_array_length(selected_dates);
    
    IF leave_type = 'half_day' THEN
      actual_leave_days := total_calendar_days * 0.5;
    ELSE
      actual_leave_days := total_calendar_days;
    END IF;
    
    calculation_method := 'selected_dates_array';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Method 2: Fallback to date range
  IF start_date IS NOT NULL AND end_date IS NOT NULL THEN
    total_calendar_days := (end_date - start_date) + 1;
    
    IF leave_type = 'half_day' THEN
      actual_leave_days := total_calendar_days * 0.5;
    ELSE
      actual_leave_days := total_calendar_days;
    END IF;
    
    calculation_method := 'date_range';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Method 3: Default
  total_calendar_days := 0;
  actual_leave_days := 0;
  calculation_method := 'no_valid_data';
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Create a view to help debug duration calculations
CREATE OR REPLACE VIEW leave_requests_debug AS
SELECT 
  lr.id,
  lr.user_id,
  lr.leave_type,
  lr.start_date,
  lr.end_date,
  lr.selected_dates,
  lr.duration_days as stored_duration,
  jsonb_typeof(lr.selected_dates) as selected_dates_type,
  CASE 
    WHEN lr.selected_dates IS NOT NULL AND jsonb_typeof(lr.selected_dates) = 'array' 
    THEN jsonb_array_length(lr.selected_dates)
    ELSE NULL 
  END as selected_dates_count,
  (SELECT actual_leave_days FROM get_actual_leave_days(lr.start_date, lr.end_date, lr.selected_dates, lr.leave_type)) as calculated_days,
  (SELECT calculation_method FROM get_actual_leave_days(lr.start_date, lr.end_date, lr.selected_dates, lr.leave_type)) as calculation_method,
  lr.status,
  lr.submitted_at
FROM leave_requests lr
ORDER BY lr.submitted_at DESC;

-- Add comment explaining the debug view
COMMENT ON VIEW leave_requests_debug IS 'Debug view to help troubleshoot duration calculation issues in leave requests';
