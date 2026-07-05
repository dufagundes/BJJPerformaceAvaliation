-- Delete incorrectly uploaded contacts for the school owned by info@gblindale.com.
-- Run in Supabase SQL Editor.
--
-- Safety behavior:
-- - Resolves the school from the active user info@gblindale.com.
-- - Deletes contacts for that school only.
-- - If a contact is already linked to an evaluation reviewer, it is deactivated instead
--   because the database restricts deleting contacts that are referenced by reviewers.

begin;

do $$
declare
  target_admin_email text := 'info@gblindale.com';
  target_school_id uuid;
  target_school_name text;
  matching_user_count integer;
  total_contacts integer;
  used_contacts integer;
  deleted_contacts integer;
  deactivated_contacts integer;
begin
  select count(*)
  into matching_user_count
  from "User" u
  join "School" s on s."id" = u."schoolId"
  where lower(u."email") = target_admin_email
    and u."isActive" = true
    and s."isActive" = true;

  if matching_user_count = 0 then
    raise exception 'No active user/school found for %.', target_admin_email;
  end if;

  if matching_user_count > 1 then
    raise exception 'More than one active user/school found for %. Cleanup stopped to avoid deleting the wrong school contacts.', target_admin_email;
  end if;

  select u."schoolId", s."name"
  into target_school_id, target_school_name
  from "User" u
  join "School" s on s."id" = u."schoolId"
  where lower(u."email") = target_admin_email
    and u."isActive" = true
    and s."isActive" = true
  limit 1;

  select count(*)
  into total_contacts
  from "Contact"
  where "schoolId" = target_school_id;

  select count(*)
  into used_contacts
  from "Contact" c
  where c."schoolId" = target_school_id
    and exists (
      select 1
      from "Reviewer" r
      where r."contactId" = c."id"
    );

  update "Contact" c
  set "isActive" = false
  where c."schoolId" = target_school_id
    and exists (
      select 1
      from "Reviewer" r
      where r."contactId" = c."id"
    );
  get diagnostics deactivated_contacts = row_count;

  delete from "Contact" c
  where c."schoolId" = target_school_id
    and not exists (
      select 1
      from "Reviewer" r
      where r."contactId" = c."id"
    );
  get diagnostics deleted_contacts = row_count;

  raise notice 'School: % (%)', target_school_name, target_school_id;
  raise notice 'Contacts before cleanup: %', total_contacts;
  raise notice 'Contacts linked to evaluations and deactivated: %', deactivated_contacts;
  raise notice 'Contacts deleted: %', deleted_contacts;
  raise notice 'Referenced contacts detected before cleanup: %', used_contacts;
end $$;

commit;

select
  s."name" as school_name,
  count(c."id") as remaining_contacts,
  count(c."id") filter (where c."isActive" = true) as remaining_active_contacts,
  count(c."id") filter (where c."isActive" = false) as remaining_inactive_contacts
from "School" s
join "User" u on u."schoolId" = s."id"
left join "Contact" c on c."schoolId" = s."id"
where lower(u."email") = 'info@gblindale.com'
  and u."isActive" = true
  and s."isActive" = true
group by s."id", s."name";