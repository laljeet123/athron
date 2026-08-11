-- Add user state and AI memory tables for authentication, user preferences, and assistant memory.

alter table if exists profiles add column if not exists avatar_path text;

create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  theme text not null default 'dark',
  email_notifications boolean not null default true,
  premium_plan text not null default 'free',
  feature_flags jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table if exists user_preferences enable row level security;

create policy if not exists "Users can select their own preferences"
  on user_preferences
  for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert or update their own preferences"
  on user_preferences
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists ai_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  note text,
  type text not null default 'note',
  metadata jsonb,
  created_at timestamp with time zone default now()
);

alter table if exists ai_memory enable row level security;

create policy if not exists "Users can select their own ai memory"
  on ai_memory
  for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert their own ai memory"
  on ai_memory
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update their own ai memory"
  on ai_memory
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists user_statistics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  workouts_completed integer not null default 0,
  calories_burned integer not null default 0,
  active_days integer not null default 0,
  streak_days integer not null default 0,
  updated_at timestamp with time zone default now()
);

alter table if exists user_statistics enable row level security;

create policy if not exists "Users can select their own statistics"
  on user_statistics
  for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert or update their own statistics"
  on user_statistics
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'avatars') THEN
    PERFORM storage.create_bucket('avatars', '{"public": false}'::jsonb);
  END IF;
END;
$$;
