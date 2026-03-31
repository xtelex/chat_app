-- Message reactions table
-- Run in Supabase Dashboard → SQL Editor

create table if not exists public.message_reactions (
  message_id uuid not null references public.direct_messages(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  emoji      text not null check (char_length(emoji) between 1 and 8),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

alter table public.message_reactions enable row level security;

-- Required for DELETE realtime events to include old row data
alter table public.message_reactions replica identity full;

-- Drop existing policies first to avoid conflicts on re-run
drop policy if exists "Participants can read reactions" on public.message_reactions;
drop policy if exists "Users can add their own reactions" on public.message_reactions;
drop policy if exists "Users can remove their own reactions" on public.message_reactions;

create policy "Participants can read reactions"
  on public.message_reactions for select
  to authenticated
  using (true);

create policy "Users can add their own reactions"
  on public.message_reactions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove their own reactions"
  on public.message_reactions for delete
  to authenticated
  using (auth.uid() = user_id);

-- Enable realtime
do $$ begin
  alter publication supabase_realtime add table public.message_reactions;
exception when others then null;
end $$;

select pg_notify('pgrst', 'reload schema');
