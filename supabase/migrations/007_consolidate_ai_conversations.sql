-- Migration: consolidate ai_conversations schema and RLS
-- Created: 2026-08-07
-- Purpose: Provide a single canonical, secure migration for the
-- `ai_conversations` table and owner-only RLS policies.

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  message text,
  response text,
  intent text,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table public.ai_conversations enable row level security;

-- Ensure owner-only policies are present (drop any existing and recreate)
drop policy if exists allow_insert_owner on public.ai_conversations;
create policy allow_insert_owner on public.ai_conversations
  for insert
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists allow_select_owner on public.ai_conversations;
create policy allow_select_owner on public.ai_conversations
  for select
  using (auth.uid() = user_id);

drop policy if exists allow_modify_owner on public.ai_conversations;
create policy allow_modify_owner on public.ai_conversations
  for update, delete
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Note: This migration intentionally enforces owner-only read/insert/update.
-- If you previously applied a migration that allowed public insert/select
-- (for example some earlier dev migration), running this migration will
-- tighten access to owner-only and is the recommended production-safe policy.
