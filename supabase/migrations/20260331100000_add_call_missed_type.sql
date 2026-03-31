-- Allow call_missed as a media_type in direct_messages
-- Run in Supabase Dashboard → SQL Editor

alter table public.direct_messages
drop constraint if exists direct_messages_media_type_check;

alter table public.direct_messages
add constraint direct_messages_media_type_check check (
  media_type is null or media_type in ('image', 'video', 'audio', 'call_missed')
);

-- Also relax the has_content check so call_missed rows (no text, no media_path) are valid
alter table public.direct_messages
drop constraint if exists direct_messages_has_content;

alter table public.direct_messages
add constraint direct_messages_has_content check (
  (text is not null and char_length(text) between 1 and 4000)
  or media_path is not null
  or media_type = 'call_missed'
);

select pg_notify('pgrst', 'reload schema');
