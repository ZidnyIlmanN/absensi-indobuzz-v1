/*
  # Real-time Employee Status Tracking System

  1. New Tables
    - `employee_status` - Real-time status tracking with heartbeat
    - `status_history` - Audit trail for status changes
    - `status_subscriptions` - Track active connections per user

  2. Real-time Features
    - WebSocket-based status broadcasting via Supabase Realtime
    - Automatic status detection based on attendance activities
    - Heartbeat mechanism for connection monitoring
    - Status conflict resolution

  3. Security
    - RLS policies for authorized status viewing
    - Department-based access control
    - Manager override capabilities
    - Audit logging for compliance

  4. Performance
    - Optimized indexes for real-time queries
    - Materialized views for fast status lookups
    - Connection pooling and cleanup
*/

-- Create employee_status table for real-time tracking
CREATE TABLE IF NOT EXISTS employee_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('online', 'break', 'offline', 'away')),
  last_activity timestamptz DEFAULT now(),
  last_heartbeat timestamptz DEFAULT now(),
  location_lat decimal(10, 8),
  location_lng decimal(11, 8),
  location_address text,
  device_info jsonb,
  connection_id text,
  is_manual boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create status_history table for audit trail
CREATE TABLE IF NOT EXISTS status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES profiles(id),
  change_reason text,
  timestamp timestamptz DEFAULT now(),
  duration_minutes integer,
  location_lat decimal(10, 8),
  location_lng decimal(11, 8),
  device_info jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create status_subscriptions table for connection tracking
CREATE TABLE IF NOT EXISTS status_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  connection_id text NOT NULL,
  subscribed_to_users uuid[] DEFAULT '{}',
  last_ping timestamptz DEFAULT now(),
  device_info jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, connection_id)
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_employee_status_user_id ON employee_status(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_status_status ON employee_status(status);
CREATE INDEX IF NOT EXISTS idx_employee_status_last_activity ON employee_status(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_employee_status_last_heartbeat ON employee_status(last_heartbeat DESC);

CREATE INDEX IF NOT EXISTS idx_status_history_user_timestamp ON status_history(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_status_history_timestamp ON status_history(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_status_subscriptions_user_connection ON status_subscriptions(user_id, connection_id);
CREATE INDEX IF NOT EXISTS idx_status_subscriptions_last_ping ON status_subscriptions(last_ping DESC);

-- Enable Row Level Security
ALTER TABLE employee_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_subscriptions ENABLE ROW LEVEL SECURITY;

-- Employee status policies
CREATE POLICY "Users can read team member status"
  ON employee_status FOR SELECT
  TO authenticated
  USING (
    -- Users can see their own status
    auth.uid() = user_id OR
    -- Users can see colleagues in same department
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid() 
      AND p2.id = employee_status.user_id
      AND p1.department = p2.department
    ) OR
    -- Managers can see all team members
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (position ILIKE '%manager%' OR position ILIKE '%supervisor%' OR position ILIKE '%hr%')
    )
  );

CREATE POLICY "Users can update own status"
  ON employee_status FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own status record"
  ON employee_status FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Status history policies (read-only for audit)
CREATE POLICY "Users can read relevant status history"
  ON status_history FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() = changed_by OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (position ILIKE '%manager%' OR position ILIKE '%supervisor%' OR position ILIKE '%hr%')
    )
  );

-- Status subscriptions policies
CREATE POLICY "Users can manage own subscriptions"
  ON status_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_employee_status_updated_at
  BEFORE UPDATE ON employee_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update employee status based on attendance
CREATE OR REPLACE FUNCTION sync_employee_status_from_attendance()
RETURNS TRIGGER AS $$
DECLARE
  new_status text;
  status_record record;
BEGIN
  -- Determine new status based on attendance/activity
  IF TG_TABLE_NAME = 'attendance_records' THEN
    CASE NEW.status
      WHEN 'working' THEN new_status := 'online';
      WHEN 'break' THEN new_status := 'break';
      WHEN 'completed' THEN new_status := 'offline';
      ELSE new_status := 'offline';
    END CASE;
  ELSIF TG_TABLE_NAME = 'activity_records' THEN
    CASE NEW.type
      WHEN 'clock_in' THEN new_status := 'online';
      WHEN 'break_start' THEN new_status := 'break';
      WHEN 'break_end' THEN new_status := 'online';
      WHEN 'clock_out' THEN new_status := 'offline';
      WHEN 'overtime_start' THEN new_status := 'online';
      WHEN 'overtime_end' THEN new_status := 'online';
      WHEN 'client_visit_start' THEN new_status := 'online';
      WHEN 'client_visit_end' THEN new_status := 'online';
      ELSE new_status := 'online';
    END CASE;
  END IF;

  -- Get current status
  SELECT * INTO status_record FROM employee_status WHERE user_id = NEW.user_id;

  -- Insert or update employee status
  INSERT INTO employee_status (
    user_id, 
    status, 
    last_activity,
    location_lat,
    location_lng,
    location_address,
    is_manual
  ) VALUES (
    NEW.user_id,
    new_status,
    now(),
    COALESCE(NEW.location_lat, status_record.location_lat),
    COALESCE(NEW.location_lng, status_record.location_lng),
    COALESCE(NEW.location_address, status_record.location_address),
    false
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status = EXCLUDED.status,
    last_activity = EXCLUDED.last_activity,
    location_lat = COALESCE(EXCLUDED.location_lat, employee_status.location_lat),
    location_lng = COALESCE(EXCLUDED.location_lng, employee_status.location_lng),
    location_address = COALESCE(EXCLUDED.location_address, employee_status.location_address),
    is_manual = false,
    updated_at = now();

  -- Log status change to history
  IF status_record.status IS NULL OR status_record.status != new_status THEN
    INSERT INTO status_history (
      user_id,
      previous_status,
      new_status,
      change_reason,
      duration_minutes,
      location_lat,
      location_lng
    ) VALUES (
      NEW.user_id,
      status_record.status,
      new_status,
      'Automatic from ' || TG_TABLE_NAME,
      CASE 
        WHEN status_record.last_activity IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (now() - status_record.last_activity)) / 60
        ELSE NULL 
      END,
      COALESCE(NEW.location_lat, status_record.location_lat),
      COALESCE(NEW.location_lng, status_record.location_lng)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for automatic status updates
DROP TRIGGER IF EXISTS trigger_sync_status_from_attendance ON attendance_records;
CREATE TRIGGER trigger_sync_status_from_attendance
  AFTER INSERT OR UPDATE OF status ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION sync_employee_status_from_attendance();

DROP TRIGGER IF EXISTS trigger_sync_status_from_activity ON activity_records;
CREATE TRIGGER trigger_sync_status_from_activity
  AFTER INSERT ON activity_records
  FOR EACH ROW
  EXECUTE FUNCTION sync_employee_status_from_attendance();

-- Function to manually update employee status
CREATE OR REPLACE FUNCTION update_employee_status(
  target_user_id uuid,
  new_status text,
  reason text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  current_status_record record;
  can_update boolean := false;
BEGIN
  -- Check if user can update this status
  SELECT * INTO current_status_record FROM employee_status WHERE user_id = target_user_id;
  
  -- Users can update their own status, managers can update team status
  IF auth.uid() = target_user_id THEN
    can_update := true;
  ELSIF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (position ILIKE '%manager%' OR position ILIKE '%supervisor%' OR position ILIKE '%hr%')
  ) THEN
    can_update := true;
  END IF;

  IF NOT can_update THEN
    RAISE EXCEPTION 'Unauthorized to update employee status';
  END IF;

  -- Update status
  INSERT INTO employee_status (
    user_id, 
    status, 
    last_activity,
    is_manual
  ) VALUES (
    target_user_id,
    new_status,
    now(),
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status = EXCLUDED.status,
    last_activity = EXCLUDED.last_activity,
    is_manual = true,
    updated_at = now();

  -- Log to history
  INSERT INTO status_history (
    user_id,
    previous_status,
    new_status,
    changed_by,
    change_reason
  ) VALUES (
    target_user_id,
    current_status_record.status,
    new_status,
    auth.uid(),
    COALESCE(reason, 'Manual update')
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update heartbeat and detect offline users
CREATE OR REPLACE FUNCTION update_heartbeat(connection_id text, device_info jsonb DEFAULT NULL)
RETURNS boolean AS $$
BEGIN
  -- Update employee status heartbeat
  UPDATE employee_status 
  SET 
    last_heartbeat = now(),
    device_info = COALESCE(device_info, employee_status.device_info),
    connection_id = update_heartbeat.connection_id
  WHERE user_id = auth.uid();

  -- Update subscription heartbeat
  INSERT INTO status_subscriptions (user_id, connection_id, last_ping, device_info)
  VALUES (auth.uid(), update_heartbeat.connection_id, now(), device_info)
  ON CONFLICT (user_id, connection_id) DO UPDATE SET
    last_ping = now(),
    device_info = COALESCE(EXCLUDED.device_info, status_subscriptions.device_info);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up stale connections and mark users offline
CREATE OR REPLACE FUNCTION cleanup_stale_connections()
RETURNS void AS $$
DECLARE
  stale_threshold timestamptz := now() - INTERVAL '5 minutes';
  offline_user record;
BEGIN
  -- Mark users as offline if no heartbeat for 5 minutes
  FOR offline_user IN 
    SELECT user_id, status 
    FROM employee_status 
    WHERE last_heartbeat < stale_threshold 
    AND status != 'offline'
  LOOP
    -- Update to offline status
    UPDATE employee_status 
    SET 
      status = 'offline',
      last_activity = now(),
      updated_at = now()
    WHERE user_id = offline_user.user_id;

    -- Log status change
    INSERT INTO status_history (
      user_id,
      previous_status,
      new_status,
      change_reason
    ) VALUES (
      offline_user.user_id,
      offline_user.status,
      'offline',
      'Connection timeout'
    );
  END LOOP;

  -- Clean up old subscriptions
  DELETE FROM status_subscriptions 
  WHERE last_ping < stale_threshold;

  -- Clean up old history (keep 30 days)
  DELETE FROM status_history 
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create materialized view for fast status lookups
CREATE MATERIALIZED VIEW IF NOT EXISTS employee_status_realtime AS
SELECT 
  p.id,
  p.name,
  p.employee_id,
  p.department,
  p.position,
  p.avatar_url,
  COALESCE(es.status, 'offline') as current_status,
  es.last_activity,
  es.last_heartbeat,
  es.location_address,
  es.is_manual,
  CASE 
    WHEN es.last_heartbeat > now() - INTERVAL '2 minutes' THEN true
    ELSE false
  END as is_connected,
  -- Calculate time in current status
  CASE 
    WHEN es.last_activity IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (now() - es.last_activity)) / 60
    ELSE NULL 
  END as minutes_in_status,
  now() as cache_updated_at
FROM profiles p
LEFT JOIN employee_status es ON p.id = es.user_id
WHERE p.employee_id IS NOT NULL;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_status_realtime_id 
ON employee_status_realtime(id);

-- Function to refresh status cache
CREATE OR REPLACE FUNCTION refresh_employee_status_realtime()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY employee_status_realtime;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to broadcast status changes via pg_notify
CREATE OR REPLACE FUNCTION broadcast_status_change()
RETURNS TRIGGER AS $$
DECLARE
  employee_info record;
  notification_payload jsonb;
BEGIN
  -- Get employee information
  SELECT name, employee_id, department, position, avatar_url
  INTO employee_info
  FROM profiles 
  WHERE id = NEW.user_id;

  -- Build notification payload
  notification_payload := json_build_object(
    'type', 'status_change',
    'employee_id', NEW.user_id,
    'employee_name', employee_info.name,
    'employee_number', employee_info.employee_id,
    'department', employee_info.department,
    'position', employee_info.position,
    'avatar_url', employee_info.avatar_url,
    'old_status', COALESCE(OLD.status, 'unknown'),
    'new_status', NEW.status,
    'last_activity', NEW.last_activity,
    'location', CASE 
      WHEN NEW.location_address IS NOT NULL 
      THEN json_build_object(
        'address', NEW.location_address,
        'latitude', NEW.location_lat,
        'longitude', NEW.location_lng
      )
      ELSE NULL 
    END,
    'is_manual', NEW.is_manual,
    'timestamp', EXTRACT(epoch FROM now()),
    'connection_id', NEW.connection_id
  );

  -- Broadcast to all subscribers
  PERFORM pg_notify('employee_status_updates', notification_payload::text);

  -- Refresh materialized view
  PERFORM refresh_employee_status_realtime();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for status change broadcasting
DROP TRIGGER IF EXISTS trigger_broadcast_status_change ON employee_status;
CREATE TRIGGER trigger_broadcast_status_change
  AFTER INSERT OR UPDATE OF status ON employee_status
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_status_change();

-- Function to get team status for managers
CREATE OR REPLACE FUNCTION get_team_status(manager_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  employee_id uuid,
  employee_name text,
  employee_number text,
  department text,
  position text,
  avatar_url text,
  current_status text,
  last_activity timestamptz,
  minutes_in_status numeric,
  is_connected boolean,
  location_address text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    esr.id,
    esr.name,
    esr.employee_id,
    esr.department,
    esr.position,
    esr.avatar_url,
    esr.current_status,
    esr.last_activity,
    esr.minutes_in_status,
    esr.is_connected,
    esr.location_address
  FROM employee_status_realtime esr
  WHERE 
    -- Show team members in same department
    esr.department = (SELECT department FROM profiles WHERE id = manager_id) OR
    -- Or if user is manager/HR, show all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = manager_id 
      AND (position ILIKE '%manager%' OR position ILIKE '%supervisor%' OR position ILIKE '%hr%')
    )
  ORDER BY esr.current_status DESC, esr.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get status statistics
CREATE OR REPLACE FUNCTION get_status_statistics()
RETURNS TABLE(
  total_employees integer,
  online_count integer,
  break_count integer,
  offline_count integer,
  away_count integer,
  connected_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer as total_employees,
    COUNT(CASE WHEN current_status = 'online' THEN 1 END)::integer as online_count,
    COUNT(CASE WHEN current_status = 'break' THEN 1 END)::integer as break_count,
    COUNT(CASE WHEN current_status = 'offline' THEN 1 END)::integer as offline_count,
    COUNT(CASE WHEN current_status = 'away' THEN 1 END)::integer as away_count,
    COUNT(CASE WHEN is_connected THEN 1 END)::integer as connected_count
  FROM employee_status_realtime;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle connection cleanup on disconnect
CREATE OR REPLACE FUNCTION handle_connection_disconnect(connection_id text)
RETURNS void AS $$
BEGIN
  -- Remove subscription
  DELETE FROM status_subscriptions 
  WHERE connection_id = handle_connection_disconnect.connection_id;

  -- Update employee status if this was their only connection
  UPDATE employee_status 
  SET 
    status = CASE 
      WHEN status = 'online' THEN 'away'
      ELSE status 
    END,
    connection_id = NULL,
    updated_at = now()
  WHERE connection_id = handle_connection_disconnect.connection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to initialize employee status for new users
CREATE OR REPLACE FUNCTION initialize_employee_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO employee_status (user_id, status, last_activity)
  VALUES (NEW.id, 'offline', now())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to initialize status for new profiles
DROP TRIGGER IF EXISTS trigger_initialize_employee_status ON profiles;
CREATE TRIGGER trigger_initialize_employee_status
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_employee_status();

-- Create view for status dashboard
CREATE OR REPLACE VIEW status_dashboard AS
SELECT 
  esr.*,
  sh.previous_status,
  sh.change_reason,
  sh.duration_minutes as last_status_duration,
  -- Calculate productivity metrics
  CASE 
    WHEN esr.current_status = 'online' AND esr.minutes_in_status > 240 THEN 'high_productivity'
    WHEN esr.current_status = 'online' AND esr.minutes_in_status > 120 THEN 'medium_productivity'
    WHEN esr.current_status = 'break' AND esr.minutes_in_status > 60 THEN 'long_break'
    WHEN esr.current_status = 'offline' AND esr.minutes_in_status < 60 THEN 'recently_offline'
    ELSE 'normal'
  END as productivity_indicator
FROM employee_status_realtime esr
LEFT JOIN LATERAL (
  SELECT previous_status, change_reason, duration_minutes
  FROM status_history 
  WHERE user_id = esr.id 
  ORDER BY timestamp DESC 
  LIMIT 1
) sh ON true;

-- Add comments for documentation
COMMENT ON TABLE employee_status IS 'Real-time employee status tracking with heartbeat monitoring';
COMMENT ON TABLE status_history IS 'Audit trail for all employee status changes';
COMMENT ON TABLE status_subscriptions IS 'Track active WebSocket connections for real-time updates';
COMMENT ON MATERIALIZED VIEW employee_status_realtime IS 'Optimized view for real-time status queries';
COMMENT ON FUNCTION sync_employee_status_from_attendance() IS 'Automatically sync employee status based on attendance and activity changes';
COMMENT ON FUNCTION broadcast_status_change() IS 'Broadcast status changes to all connected clients via pg_notify';
COMMENT ON FUNCTION update_employee_status(uuid, text, text) IS 'Manually update employee status with proper authorization checks';
COMMENT ON FUNCTION cleanup_stale_connections() IS 'Clean up stale connections and mark inactive users as offline';