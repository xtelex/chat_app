-- User custom stickers table
-- Allows users to upload and save their own stickers

create table if not exists public.user_stickers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  storage_path text not null,
  emoji_fallback text default '🎨',
  constraint user_stickers_name_length check (char_length(name) between 1 and 50)
);

-- Index for efficient queries
create index if not exists user_stickers_user_id_idx on public.user_stickers (user_id, created_at desc);

-- RLS policies
alter table public.user_stickers enable row level security;

-- Users can read their own stickers
drop policy if exists "Users can read their own stickers" on public.user_stickers;
create policy "Users can read their own stickers"
on public.user_stickers for select
to authenticated
using (auth.uid() = user_id);

-- Users can insert their own stickers
drop policy if exists "Users can insert their own stickers" on public.user_stickers;
create policy "Users can insert their own stickers"
on public.user_stickers for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can delete their own stickers
drop policy if exists "Users can delete their own stickers" on public.user_stickers;
create policy "Users can delete their own stickers"
on public.user_stickers for delete
to authenticated
using (auth.uid() = user_id);

-- Enable realtime
alter publication supabase_realtime add table public.user_stickers;

-- Refresh schema
select pg_notify('pgrst', 'reload schema');
