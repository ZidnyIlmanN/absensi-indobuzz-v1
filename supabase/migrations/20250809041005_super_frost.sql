/*
  # Create Leave Requests System

  1. New Tables
    - `leave_requests` - Store leave request data with full/half day support
    - Enhanced with proper file attachment handling

  2. Security
    - Enable RLS on leave_requests table
    - Add policies for users to manage their own requests
    - Add policies for managers/HR to review requests

  3. Features
    - Support for full day and half day leave types
    - Multiple file attachments per request
    - Proper status tracking and approval workflow
    - Audit trail with timestamps
*/

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  leave_type text NOT NULL CHECK (leave_type IN ('full_day', 'half_day')),
  leave_date date NOT NULL,
  description text NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_date ON leave_requests(leave_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_status ON leave_requests(user_id, status);

-- Enable Row Level Security
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Leave requests policies
CREATE POLICY "Users can read own leave requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leave requests"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending leave requests"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- Managers can view and update team requests (optional - for future implementation)
CREATE POLICY "Managers can review team requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (position ILIKE '%manager%' OR position ILIKE '%supervisor%' OR position ILIKE '%hr%')
    )
  );

CREATE POLICY "Managers can update team requests"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (position ILIKE '%manager%' OR position ILIKE '%supervisor%' OR position ILIKE '%hr%')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for leave request attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'leave-attachments', 
  'leave-attachments', 
  false, 
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg', 
    'image/png', 
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for leave attachments
CREATE POLICY "Users can upload their own leave attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'leave-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read their own leave attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'leave-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own leave attachments"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'leave-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own leave attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'leave-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Managers can read team attachments (optional)
CREATE POLICY "Managers can read team leave attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'leave-attachments' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (position ILIKE '%manager%' OR position ILIKE '%supervisor%' OR position ILIKE '%hr%')
    )
  );