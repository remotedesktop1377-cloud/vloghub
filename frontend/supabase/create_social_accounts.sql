-- Social accounts table to store per-platform connection details
-- Run this in Supabase SQL editor.

create table if not exists public.social_accounts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    platform text not null,               -- e.g. youtube, instagram, tiktok, facebook
    channel_id text,                      -- platform-specific channel/page/profile id
    channel_name text,                    -- platform-specific display name
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Unique constraint to prevent duplicate platform connections per user
create unique index if not exists idx_social_accounts_user_platform_unique
  on public.social_accounts(user_id, platform);

-- Helpful index
create index if not exists idx_social_accounts_user_platform
  on public.social_accounts(user_id, platform);

