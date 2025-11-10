-- Create user_tickets table (כרטיסיות משתמשים)
-- This table tracks purchased tickets for users
create table if not exists public.user_tickets (
  id uuid not null default extensions.uuid_generate_v4(),
  user_id text not null,
  plan_id uuid not null,
  status text not null default 'active' check (status in ('active', 'expired', 'depleted', 'cancelled')),
  total_sessions integer not null,
  sessions_remaining integer not null,
  purchase_date timestamp with time zone not null default now(),
  expiry_date timestamp with time zone not null,
  payment_method text null,
  payment_reference text null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_tickets_pkey primary key (id),
  constraint user_tickets_plan_id_fkey foreign key (plan_id) references ticket_plans (id) on delete restrict,
  constraint sessions_remaining_check check (sessions_remaining >= 0 and sessions_remaining <= total_sessions)
) tablespace pg_default;

-- Create indexes
create index if not exists user_tickets_user_id_idx on public.user_tickets using btree (user_id);
create index if not exists user_tickets_plan_id_idx on public.user_tickets using btree (plan_id);
create index if not exists user_tickets_status_idx on public.user_tickets using btree (status);
create index if not exists user_tickets_expiry_date_idx on public.user_tickets using btree (expiry_date);

-- Create trigger to update updated_at
create or replace function public.update_user_tickets_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_tickets_updated_at
  before update on public.user_tickets
  for each row
  execute function public.update_user_tickets_updated_at();

-- Function to use a ticket session
create or replace function public.use_ticket_session(ticket_id uuid)
returns boolean as $$
declare
  current_remaining integer;
  current_status text;
begin
  -- Get current status
  select sessions_remaining, status into current_remaining, current_status
  from public.user_tickets
  where id = ticket_id;

  -- Check if ticket is active and has sessions remaining
  if current_status != 'active' or current_remaining <= 0 then
    return false;
  end if;

  -- Decrease sessions remaining
  update public.user_tickets
  set 
    sessions_remaining = sessions_remaining - 1,
    status = case 
      when sessions_remaining - 1 = 0 then 'depleted'
      else 'active'
    end
  where id = ticket_id;

  return true;
end;
$$ language plpgsql;

-- Function to automatically expire tickets
create or replace function public.expire_tickets()
returns void as $$
begin
  update public.user_tickets
  set status = 'expired'
  where status = 'active' and expiry_date < now();
end;
$$ language plpgsql;

-- Add RLS policies
alter table public.user_tickets enable row level security;

-- Policy: Users can view their own tickets
create policy "Users can view their own tickets"
  on public.user_tickets
  for select
  using (auth.uid()::text = user_id);

-- Policy: Users can insert their own tickets
create policy "Users can insert their own tickets"
  on public.user_tickets
  for insert
  with check (auth.uid()::text = user_id);

-- Policy: Users can update their own tickets
create policy "Users can update their own tickets"
  on public.user_tickets
  for update
  using (auth.uid()::text = user_id);

-- Policy: Admins can view all tickets (add admin check as needed)
create policy "Admins can view all tickets"
  on public.user_tickets
  for select
  using (false); -- Update this with your admin check
