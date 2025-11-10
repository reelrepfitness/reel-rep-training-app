-- Create ticket_plans table (כרטיסיות)
-- This table stores the different ticket types available
create table if not exists public.ticket_plans (
  id uuid not null default extensions.uuid_generate_v4(),
  name text not null,
  name_hebrew text not null,
  total_sessions integer not null,
  validity_days integer not null,
  price numeric(10, 2) not null,
  description text null,
  description_hebrew text null,
  is_for_new_members_only boolean not null default false,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ticket_plans_pkey primary key (id)
) tablespace pg_default;

-- Insert default ticket plans
INSERT INTO public.ticket_plans (name, name_hebrew, total_sessions, validity_days, price, description_hebrew, is_for_new_members_only)
VALUES
  ('10 Sessions - 2 Months', 'כרטיסייה 10 אימונים - 2 חודשים', 10, 60, 0, '10 אימונים תקפים ל-2 חודשים', false),
  ('20 Sessions - 3 Months', 'כרטיסייה 20 אימונים - 3 חודשים', 20, 90, 0, '20 אימונים תקפים ל-3 חודשים', false),
  ('3 Sessions - 2 Weeks (New Members)', 'כרטיסייה 3 אימונים - שבועיים (חברים חדשים)', 3, 14, 0, '3 אימונים תקפים לשבועיים - למצטרפים חדשים בלבד', true);

-- Create indexes
create index if not exists ticket_plans_is_active_idx on public.ticket_plans using btree (is_active);
create index if not exists ticket_plans_is_for_new_members_only_idx on public.ticket_plans using btree (is_for_new_members_only);

-- Create trigger to update updated_at
create or replace function public.update_ticket_plans_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_ticket_plans_updated_at
  before update on public.ticket_plans
  for each row
  execute function public.update_ticket_plans_updated_at();

-- Add RLS policies
alter table public.ticket_plans enable row level security;

-- Policy: Anyone can view active ticket plans
create policy "Anyone can view active ticket plans"
  on public.ticket_plans
  for select
  using (is_active = true);

-- Policy: Only admins can insert ticket plans (add admin check as needed)
create policy "Only admins can insert ticket plans"
  on public.ticket_plans
  for insert
  with check (false); -- Update this with your admin check

-- Policy: Only admins can update ticket plans
create policy "Only admins can update ticket plans"
  on public.ticket_plans
  for update
  using (false); -- Update this with your admin check
