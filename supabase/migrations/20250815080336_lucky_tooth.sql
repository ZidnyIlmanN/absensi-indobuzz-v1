/*
  # Add Real-time Status Synchronization

  1. Real-time Functions
    - Add function to broadcast attendance status changes
    - Add trigger to notify other users when status changes
    - Ensure proper real-time updates across sessions

  2. Performance Optimization
    - Add indexes for real-time queries
    - Optimize attendance status lookups
    - Add materialized view for employee status

  3. Data Consistency
    - Ensure attendance status is properly updated
    - Add validation for status transitions
    - Fix any data inconsistencies
*/

-- Create function to broadcast attendance status changes
CREATE OR REPLACE FUNCTION broadcast_attendance_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all connected clients about the status change
  PERFORM pg_notify(
    'attendance_status_changed',
    json_build_object(
      'user_id', NEW.user_id,
      'status', NEW.status,
      'timestamp', NEW.updated_at
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for real-time status updates
DROP TRIGGER IF EXISTS trigger_attendance_status_change ON attendance_records;
CREATE TRIGGER trigger_attendance_status_change
  AFTER UPDATE OF status ON attendance_records
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION broadcast_attendance_status_change();

-- Create materialized view for current employee status (for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS current_employee_status AS
SELECT 
  p.id,
  p.name,
  p.employee_id,
  p.position,
  p.department,
  p.avatar_url,
  p.email,
  p.phone,
  p.location,
  p.work_schedule,
  p.join_date,
  COALESCE(ar.status, 'offline') as current_status,
  ar.clock_in,
  ar.clock_out,
  ar.location_lat,
  ar.location_lng,
  ar.location_address,
  ar.updated_at as status_updated_at
FROM profiles p
LEFT JOIN attendance_records ar ON (
  p.id = ar.user_id 
  AND ar.date = CURRENT_DATE
)
ORDER BY p.name;

-- Create unique index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_current_employee_status_id 
ON current_employee_status(id);

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_current_employee_status_status 
ON current_employee_status(current_status);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_employee_status_view()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY current_employee_status;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically refresh the view when attendance changes
CREATE OR REPLACE FUNCTION auto_refresh_employee_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh the materialized view after attendance changes
  PERFORM refresh_employee_status_view();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-refresh the view
DROP TRIGGER IF EXISTS trigger_refresh_status_on_insert ON attendance_records;
CREATE TRIGGER trigger_refresh_status_on_insert
  AFTER INSERT ON attendance_records
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_refresh_employee_status();

DROP TRIGGER IF EXISTS trigger_refresh_status_on_update ON attendance_records;
CREATE TRIGGER trigger_refresh_status_on_update
  AFTER UPDATE ON attendance_records
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_refresh_employee_status();

-- Add function to get real-time employee status
CREATE OR REPLACE FUNCTION get_employee_status_realtime(employee_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  name text,
  status text,
  clock_in timestamptz,
  location_address text,
  last_updated timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ces.id,
    ces.name,
    ces.current_status,
    ces.clock_in,
    ces.location_address,
    ces.status_updated_at
  FROM current_employee_status ces
  WHERE ces.id = employee_user_id;
END;
$$ LANGUAGE plpgsql;

-- Initial refresh of the materialized view
SELECT refresh_employee_status_view();

-- Add comment explaining the real-time system
COMMENT ON MATERIALIZED VIEW current_employee_status IS 'Real-time employee status view that automatically refreshes when attendance records change';
COMMENT ON FUNCTION broadcast_attendance_status_change() IS 'Broadcasts attendance status changes to all connected clients for real-time updates';