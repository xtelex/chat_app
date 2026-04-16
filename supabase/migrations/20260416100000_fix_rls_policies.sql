-- Fix RLS policies for direct_messages and contact_requests
-- Run in Supabase Dashboard → SQL Editor

-- ── direct_messages ──────────────────────────────────────────────────────────

-- Allow any authenticated user to send a message (sender must be themselves)
drop policy if exists "Users can send direct messages" on public.direct_messages;
create policy "Users can send direct messages"
  on public.direct_messages for insert
  to authenticated
  with check (auth.uid() = sender_id);

-- Allow participants to read their messages
drop policy if exists "Direct messages are readable by participants" on public.direct_messages;
create policy "Direct messages are readable by participants"
  on public.direct_messages for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- ── contact_requests ─────────────────────────────────────────────────────────

-- Allow any authenticated user to send a contact request
drop policy if exists "Users can send contact requests" on public.contact_requests;
create policy "Users can send contact requests"
  on public.contact_requests for insert
  to authenticated
  with check (auth.uid() = requester_id);

-- Allow participants to read requests involving them
drop policy if exists "Users can read their contact requests" on public.contact_requests;
create policy "Users can read their contact requests"
  on public.contact_requests for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

-- Allow recipient to update (accept/decline)
drop policy if exists "Recipients can update contact requests" on public.contact_requests;
create policy "Recipients can update contact requests"
  on public.contact_requests for update
  to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- ── contacts ─────────────────────────────────────────────────────────────────

drop policy if exists "Users can read their contacts" on public.contacts;
create policy "Users can read their contacts"
  on public.contacts for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = contact_id);

drop policy if exists "Users can insert contacts" on public.contacts;
create policy "Users can insert contacts"
  on public.contacts for insert
  to authenticated
  with check (auth.uid() = user_id);

select pg_notify('pgrst', 'reload schema');
