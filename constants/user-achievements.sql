-- Create user_achievements table
create table if not exists public.user_achievements (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id text not null,
  achievement_id uuid not null,
  progress numeric not null default 0,
  completed boolean not null default false,
  date_earned timestamp with time zone null,
  is_challenge boolean not null default false,
  accepted_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_achievements_pkey primary key (id),
  constraint user_achievements_achievement_id_fkey foreign key (achievement_id) references achievements (id) on delete cascade,
  constraint user_achievements_user_achievement unique (user_id, achievement_id)
) tablespace pg_default;

-- Create index for faster queries
create index if not exists user_achievements_user_id_idx on public.user_achievements using btree (user_id);
create index if not exists user_achievements_achievement_id_idx on public.user_achievements using btree (achievement_id);
create index if not exists user_achievements_completed_idx on public.user_achievements using btree (completed);
create index if not exists user_achievements_is_challenge_idx on public.user_achievements using btree (is_challenge);

-- Create trigger to update updated_at
create or replace function public.update_user_achievements_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_achievements_updated_at
  before update on public.user_achievements
  for each row
  execute function public.update_user_achievements_updated_at();

-- Add RLS policies
alter table public.user_achievements enable row level security;

-- Policy: Users can view their own achievements
create policy "Users can view their own achievements"
  on public.user_achievements
  for select
  using (auth.uid()::text = user_id);

-- Policy: Users can insert their own achievements
create policy "Users can insert their own achievements"
  on public.user_achievements
  for insert
  with check (auth.uid()::text = user_id);

-- Policy: Users can update their own achievements
create policy "Users can update their own achievements"
  on public.user_achievements
  for update
  using (auth.uid()::text = user_id);

-- Policy: Users can delete their own achievements
create policy "Users can delete their own achievements"
  on public.user_achievements
  for delete
  using (auth.uid()::text = user_id);
