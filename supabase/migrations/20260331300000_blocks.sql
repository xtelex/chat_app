-- Blocks table — tracks who blocked whom
-- Run in Supabase Dashboard → SQL Editor

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table public.blocks enable row level security;

drop policy if exists "Users can manage their own blocks" on public.blocks;
create policy "Users can manage their own blocks"
  on public.blocks for all
  to authenticated
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

drop policy if exists "Users can see if they are blocked" on public.blocks;
create policy "Users can see if they are blocked"
  on public.blocks for select
  to authenticated
  using (auth.uid() = blocked_id);

select pg_notify('pgrst', 'reload schema');
