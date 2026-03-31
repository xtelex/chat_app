-- Direct messages (1:1) + per-contact nicknames + media storage policies
-- Run in Supabase SQL Editor if you already deployed the initial schema.

-- -----------------------------------------------------------------------------
-- Contacts: per-user nickname for a contact
-- -----------------------------------------------------------------------------
alter table public.contacts
add column if not exists nickname text;

alter table public.contacts
drop constraint if exists contacts_nickname_length;
alter table public.contacts
add constraint contacts_nickname_length check (nickname is null or char_length(nickname) between 1 and 50);

drop policy if exists "Users can update their contact nicknames" on public.contacts;
create policy "Users can update their contact nicknames"
on public.contacts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Direct messages (sender <-> recipient)
-- -----------------------------------------------------------------------------
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  text text,
  media_path text,
  media_type text,
  media_mime text,
  constraint direct_messages_not_self check (sender_id <> recipient_id),
  constraint direct_messages_media_type_check check (
    media_type is null or media_type in ('image', 'video', 'audio')
  ),
  constraint direct_messages_has_content check (
    (text is not null and char_length(text) between 1 and 4000) or media_path is not null
  )
);

create index if not exists direct_messages_created_at_idx on public.direct_messages (created_at desc);
create index if not exists direct_messages_sender_idx on public.direct_messages (sender_id, created_at desc);
create index if not exists direct_messages_recipient_idx on public.direct_messages (recipient_id, created_at desc);

alter table public.direct_messages enable row level security;

drop policy if exists "Direct messages are readable by participants" on public.direct_messages;
create policy "Direct messages are readable by participants"
on public.direct_messages
for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Users can send direct messages" on public.direct_messages;
create policy "Users can send direct messages"
on public.direct_messages
for insert
to authenticated
with check (auth.uid() = sender_id);

drop policy if exists "Senders can delete their direct messages" on public.direct_messages;
create policy "Senders can delete their direct messages"
on public.direct_messages
for delete
to authenticated
using (auth.uid() = sender_id);

-- Best-effort: enable Realtime for direct_messages changes.
do $$
begin
  begin
    alter publication supabase_realtime add table public.direct_messages;
  exception when others then
    null;
  end;
end $$;

-- -----------------------------------------------------------------------------
-- Storage bucket policies (optional): chat-media
-- Create the bucket in Dashboard -> Storage if you prefer.
-- NOTE: If you don't want to touch Storage via SQL, you can skip this section.
-- -----------------------------------------------------------------------------
-- insert into storage.buckets (id, name, public)
-- values ('chat-media', 'chat-media', false)
-- on conflict (id) do nothing;

-- Allow authenticated users to manage objects in the chat-media bucket.
-- (Supabase Storage uses RLS on storage.objects.)
drop policy if exists "Chat media is readable by authenticated users" on storage.objects;
create policy "Chat media is readable by authenticated users"
on storage.objects
for select
to authenticated
using (bucket_id = 'chat-media');

drop policy if exists "Chat media is uploadable by authenticated users" on storage.objects;
create policy "Chat media is uploadable by authenticated users"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'chat-media');

drop policy if exists "Chat media is updatable by authenticated users" on storage.objects;
create policy "Chat media is updatable by authenticated users"
on storage.objects
for update
to authenticated
using (bucket_id = 'chat-media')
with check (bucket_id = 'chat-media');

drop policy if exists "Chat media is deletable by authenticated users" on storage.objects;
create policy "Chat media is deletable by authenticated users"
on storage.objects
for delete
to authenticated
using (bucket_id = 'chat-media');

-- Refresh PostgREST schema cache so REST + client can see new tables/columns
select pg_notify('pgrst', 'reload schema');

