-- Contact requests (pending/accepted)
-- Run in Supabase SQL Editor if you already deployed the initial schema.

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

-- Refresh PostgREST schema cache so REST + client can see the new table
select pg_notify('pgrst', 'reload schema');
