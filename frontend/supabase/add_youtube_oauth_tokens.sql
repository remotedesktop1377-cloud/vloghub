-- Add youtube_oauth_tokens column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS youtube_oauth_tokens JSONB;

