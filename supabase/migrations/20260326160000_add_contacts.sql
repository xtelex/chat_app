-- Contacts (user contact list)
-- One-way relationship: user_id -> contact_id

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

-- Allow the *recipient* to see rows where they are the contact (needed for realtime "someone added me")
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
