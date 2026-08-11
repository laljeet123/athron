-- Create profiles table for personalized nutrition profiles.
-- Enable Row Level Security so users can only manage their own profile.

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text,
  age integer,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  goal text,
  activity_level text,
  training_days integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table profiles enable row level security;

create policy "Authenticated users can insert or update their own profile"
  on profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Authenticated users can select their own profile"
  on profiles
  for select
  using (auth.uid() = user_id);

-- Create foods table for nutrition database.

create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  serving_size numeric not null default 100,
  serving_unit text not null default 'g',
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  fiber_g numeric not null default 0,
  is_vegetarian boolean not null default true,
  created_at timestamp with time zone default now()
);

alter table foods enable row level security;

create policy "Public read access to foods"
  on foods
  for select
  using (true);

-- Create meal_logs table for daily nutrition entries.

create table if not exists meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  food_id uuid references foods(id),
  meal_type text not null,
  quantity numeric not null,
  unit text not null,
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  logged_at timestamp with time zone not null default now(),
  created_at timestamp with time zone default now()
);

alter table meal_logs enable row level security;

create policy "Authenticated users can insert their own meal logs"
  on meal_logs
  for insert
  with check (auth.uid() = user_id);

create policy "Authenticated users can select their own meal logs"
  on meal_logs
  for select
  using (auth.uid() = user_id);

-- Create water_logs table for hydration tracking.

create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount_ml integer not null,
  logged_at timestamp with time zone not null default now(),
  created_at timestamp with time zone default now()
);

alter table water_logs enable row level security;

create policy "Authenticated users can insert their own water logs"
  on water_logs
  for insert
  with check (auth.uid() = user_id);

create policy "Authenticated users can select their own water logs"
  on water_logs
  for select
  using (auth.uid() = user_id);
