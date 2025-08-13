/*
  # Fix Array Length Scalar Error (22023)
  
  This migration fixes the "cannot get array length of a scalar" error
  by adding proper null and type checking before calling jsonb_array_length().
*/

-- Fix the calculate_leave_days_from_selected function
CREATE OR REPLACE FUNCTION calculate_leave_days_from_selected(selected_dates jsonb, leave_type text)
RETURNS decimal AS $$
BEGIN
  -- Check if selected_dates is null or not a valid array
  IF selected_dates IS NULL OR jsonb_typeof(selected_dates) != 'array' THEN
    RETURN 0;
  END IF;
  
  -- Check if array is empty
  IF jsonb_array_length(selected_dates) = 0 THEN
    RETURN 0;
  END IF;
  
  IF leave_type = 'half_day' THEN
    RETURN (jsonb_array_length(selected_dates) * 0.5);
  ELSE
    RETURN jsonb_array_length(selected_dates);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fix the calculate_leave_duration_enhanced function
CREATE OR REPLACE FUNCTION calculate_leave_duration_enhanced(start_date date, end_date date, selected_dates jsonb, leave_type text)
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

-- Fix the validate_selected_dates function
CREATE OR REPLACE FUNCTION validate_selected_dates(selected_dates jsonb)
RETURNS boolean AS $$
BEGIN
  -- Allow null values
  IF selected_dates IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if it's a valid JSON array
  IF jsonb_typeof(selected_dates) != 'array' THEN
    RETURN false;
  END IF;
  
  -- Allow empty arrays
  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Recreate the view with fixed array handling
DROP VIEW IF EXISTS leave_requests_expanded;

CREATE OR REPLACE VIEW leave_requests_expanded AS
SELECT 
  lr.*,
  CASE 
    WHEN lr.selected_dates IS NOT NULL AND jsonb_typeof(lr.selected_dates) = 'array' THEN
      (SELECT jsonb_agg(date_val) 
       FROM jsonb_array_elements_text(lr.selected_dates) AS date_val)
    WHEN lr.start_date IS NOT NULL AND lr.end_date IS NOT NULL THEN
      (SELECT jsonb_agg(generate_series::date) 
       FROM generate_series(lr.start_date, lr.end_date, '1 day'::interval))
    ELSE
      '[]'::jsonb
  END AS all_dates,
  calculate_leave_duration_enhanced(lr.start_date, lr.end_date, lr.selected_dates, lr.leave_type) as calculated_duration
FROM leave_requests lr;

-- Add comment to the view
COMMENT ON VIEW leave_requests_expanded IS 'Fixed expanded view of leave requests with proper array handling';

-- Add a trigger to ensure data consistency
CREATE OR REPLACE FUNCTION ensure_selected_dates_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- If selected_dates is provided, ensure it's a valid array
  IF NEW.selected_dates IS NOT NULL THEN
    IF jsonb_typeof(NEW.selected_dates) != 'array' THEN
      RAISE EXCEPTION 'selected_dates must be a JSON array';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_selected_dates_consistency ON leave_requests;

CREATE TRIGGER trigger_ensure_selected_dates_consistency
  BEFORE INSERT OR UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION ensure_selected_dates_consistency();
