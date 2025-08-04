/*
  # Create Storage Buckets for Images

  1. Storage Buckets
    - `selfies` - For attendance verification selfies
    - `avatars` - For user profile photos
    - `receipts` - For reimbursement receipts (existing)

  2. Security Policies
    - Users can upload to their own folders
    - Users can read their own images
    - Public read access for avatars
    - Restricted access for selfies

  3. Storage Configuration
    - File size limits
    - Allowed file types
    - Automatic cleanup policies
*/

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('selfies', 'selfies', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('receipts', 'receipts', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Selfies bucket policies
CREATE POLICY "Users can upload their own selfies"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read their own selfies"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own selfies"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own selfies"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Avatars bucket policies (public read, authenticated write)
CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Receipts bucket policies
CREATE POLICY "Users can upload their own receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read their own receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own receipts"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to clean up old selfies (optional - for storage management)
CREATE OR REPLACE FUNCTION cleanup_old_selfies()
RETURNS void AS $$
BEGIN
  -- Delete selfies older than 90 days
  DELETE FROM storage.objects 
  WHERE bucket_id = 'selfies' 
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-selfies', '0 2 * * 0', 'SELECT cleanup_old_selfies();');