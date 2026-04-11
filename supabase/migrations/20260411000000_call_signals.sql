-- Call signals table for reliable WebRTC signaling
-- Run in Supabase Dashboard → SQL Editor

create table if not exists public.call_signals (
  id uuid primary key default gen_random_uuid(),
  call_id text not null,
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('offer', 'answer', 'ice', 'hangup', 'decline')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists call_signals_to_user_idx on public.call_signals (to_user, created_at desc);

alter table public.call_signals enable row level security;

drop policy if exists "Users can insert their own signals" on public.call_signals;
create policy "Users can insert their own signals"
  on public.call_signals for insert
  to authenticated
  with check (auth.uid() = from_user);

drop policy if exists "Users can read signals sent to them" on public.call_signals;
create policy "Users can read signals sent to them"
  on public.call_signals for select
  to authenticated
  using (auth.uid() = to_user or auth.uid() = from_user);

-- Auto-delete old signals after 1 hour
create or replace function delete_old_call_signals() returns trigger language plpgsql as $$
begin
  delete from public.call_signals where created_at < now() - interval '1 hour';
  return new;
end;
$$;

drop trigger if exists cleanup_call_signals on public.call_signals;
create trigger cleanup_call_signals
  after insert on public.call_signals
  execute function delete_old_call_signals();

-- Enable realtime
do $$ begin
  alter publication supabase_realtime add table public.call_signals;
exception when others then null;
end $$;

select pg_notify('pgrst', 'reload schema');
