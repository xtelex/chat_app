-- Create storage buckets for avatars and chat media
-- Run this in Supabase Dashboard → SQL Editor

-- Avatars bucket (public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880;

-- Chat media bucket (private, signed URLs)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-media',
  'chat-media',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/webm', 'audio/ogg', 'audio/mpeg']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 20971520;

-- Drop existing policies first to avoid conflicts on re-run
do $$ begin
  drop policy if exists "Anyone can view avatars" on storage.objects;
  drop policy if exists "Authenticated users can upload their own avatar" on storage.objects;
  drop policy if exists "Users can update their own avatar" on storage.objects;
  drop policy if exists "Users can delete their own avatar" on storage.objects;
  drop policy if exists "Users can upload chat media" on storage.objects;
  drop policy if exists "Users can view chat media they sent or received" on storage.objects;
exception when others then null;
end $$;

-- RLS policies for avatars bucket
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Authenticated users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS policies for chat-media bucket
create policy "Users can upload chat media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-media'
    and (storage.foldername(name))[1] = 'dm'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Users can view chat media they sent or received"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'chat-media'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or (storage.foldername(name))[3] = auth.uid()::text
    )
  );
