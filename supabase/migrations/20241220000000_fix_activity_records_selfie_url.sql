-- Fix missing selfie_url column in activity_records table
-- This addresses the Supabase error: column activity_records_1.selfie_url does not exist

-- Add selfie_url column to activity_records table
ALTER TABLE public.activity_records 
ADD COLUMN IF NOT EXISTS selfie_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.activity_records.selfie_url IS 'URL/path to the selfie image taken during activity';

-- Create index for performance optimization
CREATE INDEX IF NOT EXISTS idx_activity_records_selfie_url 
ON public.activity_records(selfie_url) 
WHERE selfie_url IS NOT NULL;
