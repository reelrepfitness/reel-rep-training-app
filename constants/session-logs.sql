-- Create session_logs table
-- This table logs every session attendance for tracking and history
create table if not exists public.session_logs (
  id uuid not null default extensions.uuid_generate_v4(),
  user_id text not null,
  class_id text null,
  session_date timestamp with time zone not null default now(),
  session_type text not null check (session_type in ('subscription', 'ticket', 'free', 'trial')),
  subscription_id uuid null,
  ticket_id uuid null,
  checked_in_by text null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  constraint session_logs_pkey primary key (id),
  constraint session_logs_subscription_id_fkey foreign key (subscription_id) references user_subscriptions (id) on delete set null,
  constraint session_logs_ticket_id_fkey foreign key (ticket_id) references user_tickets (id) on delete set null,
  constraint session_type_reference_check check (
    (session_type = 'subscription' and subscription_id is not null) or
    (session_type = 'ticket' and ticket_id is not null) or
    (session_type in ('free', 'trial'))
  )
) tablespace pg_default;

-- Create indexes
create index if not exists session_logs_user_id_idx on public.session_logs using btree (user_id);
create index if not exists session_logs_subscription_id_idx on public.session_logs using btree (subscription_id);
create index if not exists session_logs_ticket_id_idx on public.session_logs using btree (ticket_id);
create index if not exists session_logs_session_date_idx on public.session_logs using btree (session_date);
create index if not exists session_logs_session_type_idx on public.session_logs using btree (session_type);

-- Function to log a session and update subscription/ticket
create or replace function public.log_session(
  p_user_id text,
  p_class_id text,
  p_session_type text,
  p_subscription_id uuid default null,
  p_ticket_id uuid default null
)
returns uuid as $$
declare
  new_log_id uuid;
  plan_sessions_per_week integer;
  current_week_sessions integer;
begin
  -- Validate session type
  if p_session_type not in ('subscription', 'ticket', 'free', 'trial') then
    raise exception 'Invalid session type';
  end if;

  -- Handle subscription session
  if p_session_type = 'subscription' then
    if p_subscription_id is null then
      raise exception 'Subscription ID required for subscription session';
    end if;

    -- Get plan details
    select sp.sessions_per_week into plan_sessions_per_week
    from public.user_subscriptions us
    join public.subscription_plans sp on us.plan_id = sp.id
    where us.id = p_subscription_id and us.status = 'active';

    if not found then
      raise exception 'Active subscription not found';
    end if;

    -- Check session limit if it's a limited plan
    if plan_sessions_per_week is not null then
      select sessions_used_this_week into current_week_sessions
      from public.user_subscriptions
      where id = p_subscription_id;

      if current_week_sessions >= plan_sessions_per_week then
        raise exception 'Weekly session limit reached';
      end if;

      -- Increment weekly counter
      update public.user_subscriptions
      set sessions_used_this_week = sessions_used_this_week + 1
      where id = p_subscription_id;
    end if;
  end if;

  -- Handle ticket session
  if p_session_type = 'ticket' then
    if p_ticket_id is null then
      raise exception 'Ticket ID required for ticket session';
    end if;

    -- Use ticket session
    if not public.use_ticket_session(p_ticket_id) then
      raise exception 'Ticket not available or depleted';
    end if;
  end if;

  -- Create session log
  insert into public.session_logs (
    user_id,
    class_id,
    session_type,
    subscription_id,
    ticket_id,
    session_date
  ) values (
    p_user_id,
    p_class_id,
    p_session_type,
    p_subscription_id,
    p_ticket_id,
    now()
  ) returning id into new_log_id;

  return new_log_id;
end;
$$ language plpgsql;

-- Add RLS policies
alter table public.session_logs enable row level security;

-- Policy: Users can view their own session logs
create policy "Users can view their own session logs"
  on public.session_logs
  for select
  using (auth.uid()::text = user_id);

-- Policy: Admins can view all session logs (add admin check as needed)
create policy "Admins can view all session logs"
  on public.session_logs
  for select
  using (false); -- Update this with your admin check

-- Policy: Admins can insert session logs (add admin check as needed)
create policy "Admins can insert session logs"
  on public.session_logs
  for insert
  with check (false); -- Update this with your admin check
