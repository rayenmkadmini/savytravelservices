-- SAVY TRAVEL SERVICES — 0006 Storage buckets & policies
--
-- media      public read, admin write   (destination/package/hotel imagery)
-- documents  private                    (passports, IDs, supporting documents)
--            path layout: {user_id}/{booking|visa}/{request_id}/{uuid}-{file}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('documents', 'documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy media_public_read on storage.objects for select
  using (bucket_id = 'media');
create policy media_admin_insert on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_update on storage.objects for update
  using (bucket_id = 'media' and public.is_admin());
create policy media_admin_delete on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());

create policy documents_owner_read on storage.objects for select
  using (bucket_id = 'documents'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy documents_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy documents_owner_delete on storage.objects for delete
  using (bucket_id = 'documents'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
