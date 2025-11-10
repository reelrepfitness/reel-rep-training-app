-- Create subscription_plans table
-- This table stores the different subscription plan types available
create table if not exists public.subscription_plans (
  id uuid not null default extensions.uuid_generate_v4(),
  name text not null,
  name_hebrew text not null,
  type text not null check (type in ('unlimited', 'limited')),
  sessions_per_week integer null,
  duration_months integer not null,
  price numeric(10, 2) not null,
  description text null,
  description_hebrew text null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint subscription_plans_pkey primary key (id)
) tablespace pg_default;

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, name_hebrew, type, sessions_per_week, duration_months, price, description_hebrew)
VALUES
  ('Unlimited 3 Months', 'ללא הגבלה 3 חודשים', 'unlimited', null, 3, 0, 'אימונים ללא הגבלה למשך 3 חודשים'),
  ('Unlimited 6 Months', 'ללא הגבלה 6 חודשים', 'unlimited', null, 6, 0, 'אימונים ללא הגבלה למשך 6 חודשים'),
  ('2 Sessions/Week - 3 Months', '2 אימונים בשבוע - 3 חודשים', 'limited', 2, 3, 0, '2 אימונים בשבוע למשך 3 חודשים'),
  ('2 Sessions/Week - 6 Months', '2 אימונים בשבוע - 6 חודשים', 'limited', 2, 6, 0, '2 אימונים בשבוע למשך 6 חודשים');

-- Create indexes
create index if not exists subscription_plans_type_idx on public.subscription_plans using btree (type);
create index if not exists subscription_plans_is_active_idx on public.subscription_plans using btree (is_active);

-- Create trigger to update updated_at
create or replace function public.update_subscription_plans_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_subscription_plans_updated_at
  before update on public.subscription_plans
  for each row
  execute function public.update_subscription_plans_updated_at();

-- Add RLS policies
alter table public.subscription_plans enable row level security;

-- Policy: Anyone can view active plans
create policy "Anyone can view active subscription plans"
  on public.subscription_plans
  for select
  using (is_active = true);

-- Policy: Only admins can insert plans (add admin check as needed)
create policy "Only admins can insert subscription plans"
  on public.subscription_plans
  for insert
  with check (false); -- Update this with your admin check

-- Policy: Only admins can update plans
create policy "Only admins can update subscription plans"
  on public.subscription_plans
  for update
  using (false); -- Update this with your admin check
