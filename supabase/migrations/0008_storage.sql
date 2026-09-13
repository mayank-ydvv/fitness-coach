-- Private bucket for meal photos. public MUST be false — a public bucket
-- makes every meal photo world-readable by guessable URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meals', 'meals', false, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

-- A private bucket still needs an explicit SELECT policy: createSignedUrl()
-- is authorised by the caller's SELECT permission on the object, not by the
-- bucket being private. Path convention: {user_id}/{meal_id}.webp, so the
-- first path segment is the owner.
create policy "own meal photos select" on storage.objects for select to authenticated
  using (bucket_id = 'meals' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own meal photos insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'meals' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own meal photos update" on storage.objects for update to authenticated
  using (bucket_id = 'meals' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'meals' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own meal photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'meals' and (storage.foldername(name))[1] = (select auth.uid())::text);
