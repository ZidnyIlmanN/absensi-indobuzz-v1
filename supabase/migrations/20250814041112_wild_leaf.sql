/*
  # Create Sick Leave Requests System

  1. New Tables
    - `sick_leave_requests` - Store sick leave request data
    - Enhanced with proper file attachment handling

  2. Security
    - Enable RLS on sick_leave_requests table
    - Add policies for users to manage their own requests
    - Add policies for managers/HR to review requests

  3. Features
    - Support for single day sick leave requests
    - Multiple file attachments per request
    - Proper status tracking and approval workflow
    - Audit trail with timestamps
*/

-- Create sick_leave_requests table
CREATE TABLE IF NOT EXISTS sick_leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sick_date date NOT NULL,
  reason text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sick_leave_requests_user_id ON sick_leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_sick_leave_requests_status ON sick_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_sick_leave_requests_date ON sick_leave_requests(sick_date);
CREATE INDEX IF NOT EXISTS idx_sick_leave_requests_user_status ON sick_leave_requests(user_id, status);

-- Enable Row Level Security
ALTER TABLE sick_leave_requests ENABLE ROW LEVEL SECURITY;

-- Sick leave requests policies
CREATE POLICY "Users can read own sick leave requests"
  ON sick_leave_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sick leave requests"
  ON sick_leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending sick leave requests"
  ON sick_leave_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- Managers can view and update team requests
CREATE POLICY "Managers can review team sick leave requests"
  ON sick_leave_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (position ILIKE '%manager%' OR position ILIKE '%supervisor%' OR position ILIKE '%hr%')
    )
  );

CREATE POLICY "Managers can update team sick leave requests"
  ON sick_leave_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (position ILIKE '%manager%' OR position ILIKE '%supervisor%' OR position ILIKE '%hr%')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_sick_leave_requests_updated_at
  BEFORE UPDATE ON sick_leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add validation function for sick leave attachments
CREATE OR REPLACE FUNCTION validate_sick_leave_attachments(attachments jsonb)
RETURNS boolean AS $$
BEGIN
  -- Allow null values
  IF attachments IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if it's a valid JSON array
  IF jsonb_typeof(attachments) != 'array' THEN
    RETURN false;
  END IF;
  
  -- Allow empty arrays
  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint to ensure attachments is valid when provided
ALTER TABLE sick_leave_requests 
ADD CONSTRAINT sick_leave_requests_attachments_valid 
CHECK (validate_sick_leave_attachments(attachments));

-- Add constraint to ensure sick_date is not in the past (can be today or future)
ALTER TABLE sick_leave_requests 
ADD CONSTRAINT sick_leave_requests_date_not_past 
CHECK (sick_date >= CURRENT_DATE);

-- Add constraint to prevent duplicate sick leave requests for the same date
CREATE UNIQUE INDEX IF NOT EXISTS idx_sick_leave_requests_user_date_unique 
ON sick_leave_requests(user_id, sick_date) 
WHERE status IN ('pending', 'approved');

-- Create view for sick leave requests with user information
CREATE OR REPLACE VIEW sick_leave_requests_with_user AS
SELECT 
  slr.*,
  p.name as user_name,
  p.employee_id,
  p.department,
  p.position,
  p.email
FROM sick_leave_requests slr
JOIN profiles p ON slr.user_id = p.id
ORDER BY slr.submitted_at DESC;

-- Add comment to the view
COMMENT ON VIEW sick_leave_requests_with_user IS 'Sick leave requests with user profile information for reporting and management';