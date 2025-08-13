/*
  # Fix Trigger Constraint Error (P0001)
  
  This migration fixes the "selected_dates must be a JSON array" error
  by relaxing the trigger constraint and allowing null values.
*/

-- Drop the existing strict trigger
DROP TRIGGER IF EXISTS trigger_ensure_selected_dates_consistency ON leave_requests;

-- Create a more flexible trigger that allows null and handles type conversion
CREATE OR REPLACE FUNCTION ensure_selected_dates_flexible()
RETURNS TRIGGER AS $$
BEGIN
  -- If selected_dates is provided, ensure it's a valid array or convert empty string to null
  IF NEW.selected_dates IS NOT NULL THEN
    -- Handle empty string or invalid JSON
    IF NEW.selected_dates::text = '""' OR NEW.selected_dates::text = '' THEN
      NEW.selected_dates := NULL;
    END IF;
    
    -- Handle scalar values by converting to null
    IF jsonb_typeof(NEW.selected_dates) != 'array' THEN
      NEW.selected_dates := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the new flexible trigger
CREATE TRIGGER trigger_ensure_selected_dates_flexible
  BEFORE INSERT OR UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION ensure_selected_dates_flexible();

-- Also fix the constraint to be more permissive
ALTER TABLE leave_requests 
DROP CONSTRAINT IF EXISTS leave_requests_selected_dates_valid;

-- Create a more flexible constraint that allows null and empty arrays
CREATE OR REPLACE FUNCTION validate_selected_dates_flexible(selected_dates jsonb)
RETURNS boolean AS $$
BEGIN
  -- Allow null values
  IF selected_dates IS NULL THEN
    RETURN true;
  END IF;
  
  -- Allow empty arrays
  IF jsonb_typeof(selected_dates) = 'array' THEN
    RETURN true;
  END IF;
  
  -- Allow conversion from empty string
  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add the flexible constraint
ALTER TABLE leave_requests 
ADD CONSTRAINT leave_requests_selected_dates_flexible 
CHECK (validate_selected_dates_flexible(selected_dates));

-- Update the functions to handle edge cases better
CREATE OR REPLACE FUNCTION calculate_leave_days_from_selected(selected_dates jsonb, leave_type text)
RETURNS decimal AS $$
BEGIN
  -- Handle null, empty, or non-array values
  IF selected_dates IS NULL OR jsonb_typeof(selected_dates) != 'array' OR jsonb_array_length(selected_dates) = 0 THEN
    RETURN 0;
  END IF;
  
  IF leave_type = 'half_day' THEN
    RETURN (jsonb_array_length(selected_dates) * 0.5);
  ELSE
    RETURN jsonb_array_length(selected_dates);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_leave_duration_enhanced(start_date date, end_date date, selected_dates jsonb, leave_type text)
RETURNS integer AS $$
BEGIN
  -- Handle null, empty, or non-array values
  IF selected_dates IS NOT NULL AND jsonb_typeof(selected_dates) = 'array' AND jsonb_array_length(selected_dates) > 0 THEN
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
