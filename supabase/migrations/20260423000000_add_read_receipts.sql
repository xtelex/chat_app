-- Add read receipts to direct messages
-- This allows tracking when messages are delivered and read

-- Add columns for delivery and read status
alter table public.direct_messages
add column if not exists delivered_at timestamptz,
add column if not exists read_at timestamptz;

-- Index for efficient queries on read status
create index if not exists direct_messages_read_at_idx on public.direct_messages (recipient_id, read_at) where read_at is null;

-- Allow recipients to update read status of messages sent to them
drop policy if exists "Recipients can mark messages as read" on public.direct_messages;
create policy "Recipients can mark messages as read"
on public.direct_messages
for update
to authenticated
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);

-- Refresh PostgREST schema cache
select pg_notify('pgrst', 'reload schema');
