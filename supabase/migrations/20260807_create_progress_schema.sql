-- Supabase schema migration for Athron progress, goals, achievements, and transformation tracking

-- user_measurements
create table if not exists user_measurements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  weight numeric,
  height numeric,
  body_fat numeric,
  chest numeric,
  waist numeric,
  arms numeric,
  thighs numeric,
  muscle_mass numeric,
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists idx_user_measurements_user_id on user_measurements(user_id);

-- progress_logs
create table if not exists progress_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  metric_type text not null,
  metric_value numeric not null,
  date date not null,
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists idx_progress_logs_user_id on progress_logs(user_id);

-- user_goals
create table if not exists user_goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  goal_type text not null,
  target_value numeric,
  current_value numeric,
  deadline date,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc', now())
);

create unique index if not exists ux_user_goals_user_goal_type on user_goals(user_id, goal_type);

-- achievements
create table if not exists achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  achievement_name text not null,
  description text,
  unlocked_at timestamp with time zone
);

create index if not exists idx_achievements_user_id on achievements(user_id);

-- user_transformations
create table if not exists user_transformations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  view_type text,
  photo_url text,
  storage_path text,
  note text,
  logged_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists idx_user_transformations_user_id on user_transformations(user_id);

-- Supabase storage bucket: transformations
-- Use Supabase UI or CLI to create a public or authenticated bucket named 'transformations'.
