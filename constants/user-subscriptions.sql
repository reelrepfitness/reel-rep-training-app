-- Create user_subscriptions table
-- This table tracks active subscriptions for users
create table if not exists public.user_subscriptions (
  id uuid not null default extensions.uuid_generate_v4(),
  user_id text not null,
  plan_id uuid not null,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled', 'paused')),
  start_date timestamp with time zone not null default now(),
  end_date timestamp with time zone not null,
  sessions_used_this_week integer not null default 0,
  week_start_date timestamp with time zone not null default date_trunc('week', now()),
  payment_method text null,
  payment_reference text null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_subscriptions_pkey primary key (id),
  constraint user_subscriptions_plan_id_fkey foreign key (plan_id) references subscription_plans (id) on delete restrict
) tablespace pg_default;

-- Create indexes
create index if not exists user_subscriptions_user_id_idx on public.user_subscriptions using btree (user_id);
create index if not exists user_subscriptions_plan_id_idx on public.user_subscriptions using btree (plan_id);
create index if not exists user_subscriptions_status_idx on public.user_subscriptions using btree (status);
create index if not exists user_subscriptions_end_date_idx on public.user_subscriptions using btree (end_date);

-- Create trigger to update updated_at
create or replace function public.update_user_subscriptions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_subscriptions_updated_at
  before update on public.user_subscriptions
  for each row
  execute function public.update_user_subscriptions_updated_at();

-- Function to automatically expire subscriptions
create or replace function public.expire_subscriptions()
returns void as $$
begin
  update public.user_subscriptions
  set status = 'expired'
  where status = 'active' and end_date < now();
end;
$$ language plpgsql;

-- Function to reset weekly session counter
create or replace function public.reset_weekly_sessions()
returns void as $$
begin
  update public.user_subscriptions
  set 
    sessions_used_this_week = 0,
    week_start_date = date_trunc('week', now())
  where status = 'active' 
    and week_start_date < date_trunc('week', now());
end;
$$ language plpgsql;

-- Add RLS policies
alter table public.user_subscriptions enable row level security;

-- Policy: Users can view their own subscriptions
create policy "Users can view their own subscriptions"
  on public.user_subscriptions
  for select
  using (auth.uid()::text = user_id);

-- Policy: Users can insert their own subscriptions
create policy "Users can insert their own subscriptions"
  on public.user_subscriptions
  for insert
  with check (auth.uid()::text = user_id);

-- Policy: Users can update their own subscriptions
create policy "Users can update their own subscriptions"
  on public.user_subscriptions
  for update
  using (auth.uid()::text = user_id);

-- Policy: Admins can view all subscriptions (add admin check as needed)
create policy "Admins can view all subscriptions"
  on public.user_subscriptions
  for select
  using (false); -- Update this with your admin check
