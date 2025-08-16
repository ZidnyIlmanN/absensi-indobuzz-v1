/*
  # Enhance Real-Time Status Synchronization

  1. Database Functions
    - Add function to broadcast status changes
    - Add function to get current employee status
    - Add function to update status across all sessions

  2. Triggers
    - Add trigger to broadcast attendance status changes
    - Add trigger to broadcast activity status changes
    - Add trigger to update employee status in real-time

  3. Indexes
    - Add indexes for real-time query performance
    - Add indexes for status filtering

  4. Views
    - Add view for real-time employee status monitoring
    - Add view for debugging status sync issues
*/

-- Function to broadcast employee status changes
CREATE OR REPLACE FUNCTION broadcast_employee_status_change()
RETURNS TRIGGER AS $$
DECLARE
  employee_status text;
  employee_info record;
BEGIN
  -- Get employee information
  SELECT name, employee_id, department, position 
  INTO employee_info
  FROM profiles 
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  -- Determine new status based on the change
  IF TG_TABLE_NAME = 'attendance_records' THEN
    CASE NEW.status
      WHEN 'working' THEN employee_status := 'online';
      WHEN 'break' THEN employee_status := 'break';
      WHEN 'completed' THEN employee_status := 'offline';
      ELSE employee_status := 'offline';
    END CASE;
  ELSIF TG_TABLE_NAME = 'activity_records' THEN
    CASE NEW.type
      WHEN 'break_start' THEN employee_status := 'break';
      WHEN 'break_end' THEN employee_status := 'online';
      WHEN 'clock_out' THEN employee_status := 'offline';
      ELSE employee_status := 'online';
    END CASE;
  END IF;

  -- Broadcast the status change using pg_notify
  PERFORM pg_notify(
    'employee_status_change',
    json_build_object(
      'employee_id', COALESCE(NEW.user_id, OLD.user_id),
      'employee_name', employee_info.name,
      'employee_number', employee_info.employee_id,
      'department', employee_info.department,
      'position', employee_info.position,
      'new_status', employee_status,
      'timestamp', EXTRACT(epoch FROM now()),
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP
    )::text
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add triggers for real-time status broadcasting
DROP TRIGGER IF EXISTS trigger_broadcast_attendance_status ON attendance_records;
CREATE TRIGGER trigger_broadcast_attendance_status
  AFTER INSERT OR UPDATE OF status ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_employee_status_change();

DROP TRIGGER IF EXISTS trigger_broadcast_activity_status ON activity_records;
CREATE TRIGGER trigger_broadcast_activity_status
  AFTER INSERT ON activity_records
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_employee_status_change();

-- Function to get current employee status with caching
CREATE OR REPLACE FUNCTION get_current_employee_status(employee_id uuid)
RETURNS TABLE(
  status text,
  last_activity timestamptz,
  location_address text,
  is_working boolean
) AS $$
DECLARE
  today_date date := CURRENT_DATE;
  attendance_record record;
  latest_activity record;
BEGIN
  -- Get today's attendance record
  SELECT ar.status, ar.clock_in, ar.clock_out, ar.location_address
  INTO attendance_record
  FROM attendance_records ar
  WHERE ar.user_id = employee_id AND ar.date = today_date;

  -- Get latest activity
  SELECT act.type, act.timestamp
  INTO latest_activity
  FROM activity_records act
  JOIN attendance_records ar ON act.attendance_id = ar.id
  WHERE ar.user_id = employee_id AND ar.date = today_date
  ORDER BY act.timestamp DESC
  LIMIT 1;

  -- Determine current status
  IF attendance_record.status IS NULL THEN
    -- No attendance record for today
    status := 'offline';
    last_activity := NULL;
    location_address := NULL;
    is_working := false;
  ELSIF attendance_record.status = 'completed' THEN
    -- Already clocked out
    status := 'offline';
    last_activity := attendance_record.clock_out;
    location_address := attendance_record.location_address;
    is_working := false;
  ELSIF latest_activity.type = 'break_start' THEN
    -- Currently on break
    status := 'break';
    last_activity := latest_activity.timestamp;
    location_address := attendance_record.location_address;
    is_working := true;
  ELSE
    -- Currently working
    status := 'online';
    last_activity := COALESCE(latest_activity.timestamp, attendance_record.clock_in);
    location_address := attendance_record.location_address;
    is_working := true;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for fast employee status lookups
CREATE MATERIALIZED VIEW IF NOT EXISTS employee_status_cache AS
SELECT 
  p.id,
  p.name,
  p.employee_id,
  p.department,
  p.position,
  p.avatar_url,
  COALESCE(es.status, 'offline') as current_status,
  es.last_activity,
  es.location_address,
  COALESCE(es.is_working, false) as is_working,
  now() as cache_updated_at
FROM profiles p
LEFT JOIN LATERAL get_current_employee_status(p.id) es ON true;

-- Create unique index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_status_cache_id 
ON employee_status_cache(id);

-- Function to refresh employee status cache
CREATE OR REPLACE FUNCTION refresh_employee_status_cache()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY employee_status_cache;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh cache for specific employee
CREATE OR REPLACE FUNCTION refresh_employee_status_cache_for_user(employee_id uuid)
RETURNS void AS $$
BEGIN
  -- For now, refresh the entire cache
  -- In a more advanced implementation, you could update just one row
  PERFORM refresh_employee_status_cache();
END;
$$ LANGUAGE plpgsql;

-- Add trigger to refresh cache when attendance changes
CREATE OR REPLACE FUNCTION trigger_refresh_status_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh cache for the affected employee
  PERFORM refresh_employee_status_cache_for_user(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_refresh_cache_on_attendance ON attendance_records;
CREATE TRIGGER trigger_refresh_cache_on_attendance
  AFTER INSERT OR UPDATE OR DELETE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_status_cache();

DROP TRIGGER IF EXISTS trigger_refresh_cache_on_activity ON activity_records;
CREATE TRIGGER trigger_refresh_cache_on_activity
  AFTER INSERT ON activity_records
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_status_cache();

-- Add indexes for better real-time query performance
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_date_status 
ON attendance_records(user_id, date, status);

CREATE INDEX IF NOT EXISTS idx_activity_records_user_timestamp 
ON activity_records(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_activity_records_attendance_type_timestamp 
ON activity_records(attendance_id, type, timestamp DESC);

-- Create a function to debug status sync issues
CREATE OR REPLACE FUNCTION debug_employee_status_sync(employee_id uuid)
RETURNS TABLE(
  check_name text,
  status text,
  details jsonb
) AS $$
DECLARE
  today_date date := CURRENT_DATE;
  attendance_count integer;
  activity_count integer;
  profile_exists boolean;
BEGIN
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = employee_id) INTO profile_exists;
  
  RETURN QUERY SELECT 
    'profile_exists'::text,
    CASE WHEN profile_exists THEN 'OK' ELSE 'ERROR' END::text,
    json_build_object('exists', profile_exists)::jsonb;

  -- Check attendance records for today
  SELECT COUNT(*) INTO attendance_count
  FROM attendance_records 
  WHERE user_id = employee_id AND date = today_date;
  
  RETURN QUERY SELECT 
    'attendance_today'::text,
    CASE WHEN attendance_count > 0 THEN 'OK' ELSE 'NONE' END::text,
    json_build_object('count', attendance_count, 'date', today_date)::jsonb;

  -- Check activity records for today
  SELECT COUNT(*) INTO activity_count
  FROM activity_records act
  JOIN attendance_records att ON act.attendance_id = att.id
  WHERE att.user_id = employee_id AND att.date = today_date;
  
  RETURN QUERY SELECT 
    'activities_today'::text,
    CASE WHEN activity_count > 0 THEN 'OK' ELSE 'NONE' END::text,
    json_build_object('count', activity_count)::jsonb;

  -- Check current status calculation
  RETURN QUERY SELECT 
    'current_status'::text,
    'INFO'::text,
    (SELECT json_build_object(
      'status', status,
      'last_activity', last_activity,
      'is_working', is_working,
      'location', location_address
    )::jsonb
    FROM get_current_employee_status(employee_id));
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the enhancement
COMMENT ON FUNCTION broadcast_employee_status_change() IS 'Broadcasts employee status changes via pg_notify for real-time synchronization across all connected clients';
COMMENT ON MATERIALIZED VIEW employee_status_cache IS 'Cached view of current employee statuses for fast lookups and real-time updates';
COMMENT ON FUNCTION debug_employee_status_sync(uuid) IS 'Comprehensive debugging function to troubleshoot status synchronization issues for specific employees';