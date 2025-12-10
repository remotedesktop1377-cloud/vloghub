-- Add oauth_tokens and connected columns to social_accounts table
-- Run this in Supabase SQL editor if the table already exists

ALTER TABLE public.social_accounts
  ADD COLUMN IF NOT EXISTS oauth_tokens JSONB,
  ADD COLUMN IF NOT EXISTS connected BOOLEAN DEFAULT false;

