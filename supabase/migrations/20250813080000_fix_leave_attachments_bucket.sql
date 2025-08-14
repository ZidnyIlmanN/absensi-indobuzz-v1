-- Fix leave attachments bucket name and ensure it exists
-- This migration addresses the bucket not found error

-- First, check if the bucket exists with either naming convention
DO $$
BEGIN
    -- Create bucket with underscore naming (matching code expectation)
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'leave_attachments') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'leave_attachments', 
            'leave_attachments', 
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
        );
    END IF;

    -- Ensure policies exist for the correct bucket name
    -- Drop existing policies for old bucket name if they exist
    DROP POLICY IF EXISTS "Users can upload their own leave attachments" ON storage.objects;
    DROP POLICY IF EXISTS "Users can read their own leave attachments" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own leave attachments" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own leave attachments" ON storage.objects;
    DROP POLICY IF EXISTS "Managers can read team leave attachments" ON storage.objects;

    -- Create policies for the correct bucket name (leave_attachments)
    CREATE POLICY "Users can upload their own leave attachments"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'leave_attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

    CREATE POLICY "Users can read their own leave attachments"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'leave_attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

    CREATE POLICY "Users can update their own leave attachments"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'leave_attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

    CREATE POLICY "Users can delete their own leave attachments"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'leave_attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

    CREATE POLICY "Managers can read team leave attachments"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (
            bucket_id = 'leave_attachments' AND
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND (position ILIKE '%manager%' OR position ILIKE '%supervisor%' OR position ILIKE '%hr%')
            )
        );
END $$;

-- Ensure the bucket is properly configured
UPDATE storage.buckets 
SET public = false, 
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
        'image/jpeg', 
        'image/png', 
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ]
WHERE id = 'leave_attachments';
