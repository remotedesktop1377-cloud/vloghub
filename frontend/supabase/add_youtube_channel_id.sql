-- Add youtube_channel_id column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS youtube_channel_id TEXT;

