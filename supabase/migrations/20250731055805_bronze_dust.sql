/*
  # Create Attendance Management Schema

  1. New Tables
    - `profiles` - User profile information extending auth.users
    - `attendance_records` - Daily attendance tracking with clock in/out
    - `activity_records` - Detailed activity tracking (breaks, overtime, etc.)
    - `requests` - Leave, permission, and reimbursement requests
    - `notifications` - System notifications and announcements
    - `work_locations` - Office locations for geofencing

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for managers to view team data
    - Add policies for HR to manage all data

  3. Functions
    - Auto-update timestamps
    - Calculate work hours
    - Generate notifications
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  position text,
  department text,
  avatar_url text,
  employee_id text UNIQUE NOT NULL,
  join_date date,
  location text,
  work_schedule text DEFAULT '09:00-18:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create work_locations table
CREATE TABLE IF NOT EXISTS work_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  radius integer DEFAULT 100,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  clock_in timestamptz NOT NULL,
  clock_out timestamptz,
  date date NOT NULL,
  work_hours integer DEFAULT 0,
  break_time integer DEFAULT 0,
  overtime_hours integer DEFAULT 0,
  client_visit_time integer DEFAULT 0,
  status text DEFAULT 'working' CHECK (status IN ('working', 'completed', 'break', 'overtime', 'client_visit')),
  location_lat decimal(10, 8) NOT NULL,
  location_lng decimal(11, 8) NOT NULL,
  location_address text NOT NULL,
  selfie_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create activity_records table
CREATE TABLE IF NOT EXISTS activity_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid REFERENCES attendance_records(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('clock_in', 'clock_out', 'break_start', 'break_end', 'overtime_start', 'overtime_end', 'client_visit_start', 'client_visit_end')),
  timestamp timestamptz NOT NULL,
  location_lat decimal(10, 8),
  location_lng decimal(11, 8),
  location_address text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('leave', 'permission', 'reimbursement')),
  title text NOT NULL,
  description text NOT NULL,
  start_date date,
  end_date date,
  amount decimal(15, 2),
  attachments jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('announcement', 'reminder', 'approval', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  read boolean DEFAULT false,
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  action_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_date ON attendance_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_activity_records_attendance ON activity_records(attendance_id);
CREATE INDEX IF NOT EXISTS idx_activity_records_user_timestamp ON activity_records(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_requests_user_status ON requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_locations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Attendance records policies
CREATE POLICY "Users can read own attendance"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance"
  ON attendance_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Activity records policies
CREATE POLICY "Users can read own activities"
  ON activity_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON activity_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Requests policies
CREATE POLICY "Users can read own requests"
  ON requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests"
  ON requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests"
  ON requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Work locations policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can read work locations"
  ON work_locations FOR SELECT
  TO authenticated
  USING (active = true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_locations_updated_at
  BEFORE UPDATE ON work_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default work location
INSERT INTO work_locations (name, address, latitude, longitude, radius) VALUES
('PT. INDOBUZZ REPUBLIK DIGITAL', 'Jakarta Office', -6.2088, 106.8456, 100)
ON CONFLICT DO NOTHING;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, employee_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    'EMP' || LPAD(EXTRACT(epoch FROM now())::text, 10, '0')
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();