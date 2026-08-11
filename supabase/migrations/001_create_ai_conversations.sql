-- Migration: create ai_conversations table with RLS

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

-- allow owners to insert
create policy "allow_insert_owner" on public.ai_conversations
  for insert using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- allow owners to select
create policy "allow_select_owner" on public.ai_conversations
  for select using (auth.uid() = user_id);

-- allow owners to delete/update their rows
create policy "allow_modify_owner" on public.ai_conversations
  for update, delete using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- allow server-side functions (service_role) to bypass policies if necessary
-- (service role uses the anon role; server-side calls should use the service key)
