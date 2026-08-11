-- Create exercise_rules table for AI form detection rules.
create table if not exists exercise_rules (
  id uuid primary key default gen_random_uuid(),
  exercise_id integer not null references exercises(id),
  rule_name text not null,
  joint text not null,
  min_angle integer,
  max_angle integer,
  feedback text not null,
  severity text not null default 'warning',
  created_at timestamp with time zone default now()
);

alter table exercise_rules enable row level security;

create policy "Public read access for exercise rules"
  on exercise_rules
  for select
  using (true);

create policy "Public insert access for exercise rules"
  on exercise_rules
  for insert
  with check (true);
