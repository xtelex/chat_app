-- Chat app schema for Supabase Postgres
-- Apply via Supabase Dashboard SQL Editor, or via Supabase CLI migrations.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Utility: updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Profiles (one row per auth user)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  display_name text,
  avatar_url text
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
create policy "Profiles are readable by authenticated users"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
on public.profiles
for delete
to authenticated
using (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- Messages (global chat room)
-- -----------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  constraint messages_text_length check (char_length(text) between 1 and 2000)
);

create index if not exists messages_created_at_idx on public.messages (created_at desc);
create index if not exists messages_sender_id_idx on public.messages (sender_id);

alter table public.messages enable row level security;

drop policy if exists "Messages are readable by authenticated users" on public.messages;
create policy "Messages are readable by authenticated users"
on public.messages
for select
to authenticated
using (true);

drop policy if exists "Users can insert their own messages" on public.messages;
create policy "Users can insert their own messages"
on public.messages
for insert
to authenticated
with check (auth.uid() = sender_id);

drop policy if exists "Users can update their own messages" on public.messages;
create policy "Users can update their own messages"
on public.messages
for update
to authenticated
using (auth.uid() = sender_id)
with check (auth.uid() = sender_id);

drop policy if exists "Users can delete their own messages" on public.messages;
create policy "Users can delete their own messages"
on public.messages
for delete
to authenticated
using (auth.uid() = sender_id);

-- -----------------------------------------------------------------------------
-- Keep profiles in sync with auth.users
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.email
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    display_name = coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.email
    ),
    avatar_url = coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    ),
    updated_at = now()
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of raw_user_meta_data, email on auth.users
for each row execute function public.handle_user_updated();

-- Backfill profiles for existing users
insert into public.profiles (id, display_name, avatar_url)
select
  u.id,
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    u.email
  ),
  coalesce(
    u.raw_user_meta_data ->> 'avatar_url',
    u.raw_user_meta_data ->> 'picture'
  )
from auth.users u
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Contacts (user contact list)
-- -----------------------------------------------------------------------------
create table if not exists public.contacts (
  user_id uuid not null,
  contact_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, contact_id),
  constraint contacts_not_self check (user_id <> contact_id),
  constraint contacts_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade,
  constraint contacts_contact_id_fkey foreign key (contact_id) references public.profiles (id) on delete cascade
);

create index if not exists contacts_contact_id_idx on public.contacts (contact_id);

alter table public.contacts enable row level security;

drop policy if exists "Contacts are readable by owner" on public.contacts;
create policy "Contacts are readable by owner"
on public.contacts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Contacts are readable by contact" on public.contacts;
create policy "Contacts are readable by contact"
on public.contacts
for select
to authenticated
using (auth.uid() = contact_id);

drop policy if exists "Users can add contacts" on public.contacts;
create policy "Users can add contacts"
on public.contacts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can remove contacts" on public.contacts;
create policy "Users can remove contacts"
on public.contacts
for delete
to authenticated
using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Contact requests (pending/accepted/declined)
-- -----------------------------------------------------------------------------
create table if not exists public.contact_requests (
  requester_id uuid not null,
  recipient_id uuid not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (requester_id, recipient_id),
  constraint contact_requests_not_self check (requester_id <> recipient_id),
  constraint contact_requests_status_check check (status in ('pending', 'accepted', 'declined')),
  constraint contact_requests_requester_id_fkey foreign key (requester_id) references public.profiles (id) on delete cascade,
  constraint contact_requests_recipient_id_fkey foreign key (recipient_id) references public.profiles (id) on delete cascade
);

create index if not exists contact_requests_recipient_status_idx
  on public.contact_requests (recipient_id, status, created_at desc);

create index if not exists contact_requests_requester_status_idx
  on public.contact_requests (requester_id, status, created_at desc);

drop trigger if exists set_contact_requests_updated_at on public.contact_requests;
create trigger set_contact_requests_updated_at
before update on public.contact_requests
for each row execute function public.set_updated_at();

-- When a recipient accepts a request, automatically add each other as contacts.
create or replace function public.handle_contact_request_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'pending' and new.status = 'accepted' then
    if to_regclass('public.contacts') is null then
      return new;
    end if;

    insert into public.contacts (user_id, contact_id)
    values
      (new.requester_id, new.recipient_id),
      (new.recipient_id, new.requester_id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_contact_request_status on public.contact_requests;
create trigger on_contact_request_status
after update of status on public.contact_requests
for each row execute function public.handle_contact_request_status();

alter table public.contact_requests enable row level security;

drop policy if exists "Contact requests are readable by participants" on public.contact_requests;
create policy "Contact requests are readable by participants"
on public.contact_requests
for select
to authenticated
using (auth.uid() = requester_id or auth.uid() = recipient_id);

drop policy if exists "Users can create requests" on public.contact_requests;
create policy "Users can create requests"
on public.contact_requests
for insert
to authenticated
with check (auth.uid() = requester_id);

drop policy if exists "Recipients can update request status" on public.contact_requests;
create policy "Recipients can update request status"
on public.contact_requests
for update
to authenticated
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);

drop policy if exists "Participants can delete requests" on public.contact_requests;
create policy "Participants can delete requests"
on public.contact_requests
for delete
to authenticated
using (auth.uid() = requester_id or auth.uid() = recipient_id);

-- Best-effort: enable Realtime for request/contact changes (may already be enabled via Dashboard).
do $$
begin
  begin
    alter publication supabase_realtime add table public.contact_requests;
  exception when others then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.contacts;
  exception when others then
    null;
  end;
end $$;

-- -----------------------------------------------------------------------------
-- Direct messages (1:1) + per-contact nicknames
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

-- Refresh PostgREST schema cache (so the API can see new tables immediately)
select pg_notify('pgrst', 'reload schema');

-- -----------------------------------------------------------------------------
-- Storage bucket (optional): avatars
-- -----------------------------------------------------------------------------
-- This app expects a Storage bucket named "avatars". If you haven't created it
-- yet, uncomment the block below.
--
-- insert into storage.buckets (id, name, public)
-- values ('avatars', 'avatars', true)
-- on conflict (id) do nothing;
