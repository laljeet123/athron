create table if not exists ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  message text not null,
  response text not null,
  type text not null default 'voice',
  created_at timestamp with time zone default now()
);

alter table ai_conversations enable row level security;

create policy "Public read conversation history" on ai_conversations
  for select
  using (true);

create policy "Public insert conversation history" on ai_conversations
  for insert
  with check (true);
