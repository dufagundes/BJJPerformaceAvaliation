-- Reset the test admin login for Supabase SQL Editor.
-- Login after running:
--   email: admin@test.local
--   password: Admin123!

begin;

do $$
declare
  target_school_id uuid;
  target_user_id uuid;
begin
  select "id"
  into target_school_id
  from "School"
  where "name" = 'Default School'
  order by "createdAt" asc
  limit 1;

  if target_school_id is null then
    target_school_id := gen_random_uuid();

    insert into "School" ("id", "name", "isActive", "createdAt", "updatedAt")
    values (target_school_id, 'Default School', true, now(), now());
  else
    update "School"
    set "isActive" = true, "updatedAt" = now()
    where "id" = target_school_id;
  end if;

  select "id"
  into target_user_id
  from "User"
  where "schoolId" = target_school_id
    and lower("email") = 'admin@test.local'
  order by "createdAt" asc
  limit 1;

  if target_user_id is null then
    insert into "User" (
      "id",
      "schoolId",
      "name",
      "email",
      "passwordHash",
      "role",
      "isActive",
      "createdAt"
    ) values (
      gen_random_uuid(),
      target_school_id,
      'Test Admin',
      'admin@test.local',
      '$2a$12$tDFMZWvrcksmv9sL..mq..nzXH5j0UhviNz3svvrpOAPwyMxXIB16',
      'ADMIN'::"UserRole",
      true,
      now()
    );
  else
    update "User"
    set
      "name" = 'Test Admin',
      "passwordHash" = '$2a$12$tDFMZWvrcksmv9sL..mq..nzXH5j0UhviNz3svvrpOAPwyMxXIB16',
      "role" = 'ADMIN'::"UserRole",
      "isActive" = true
    where "id" = target_user_id;
  end if;

  if not exists (select 1 from "AdminConfig" where "schoolId" = target_school_id) then
    insert into "AdminConfig" (
      "id",
      "schoolId",
      "defaultCycleDurationDays",
      "defaultContactsToInvite",
      "reminderScheduleDaysBefore",
      "updatedAt"
    ) values (
      gen_random_uuid(),
      target_school_id,
      15,
      5,
      array[3, 1],
      now()
    );
  end if;
end $$;

commit;

select
  s."name" as school_name,
  u."email",
  u."role",
  u."isActive" as user_active,
  s."isActive" as school_active,
  left(u."passwordHash", 7) as password_hash_prefix
from "User" u
join "School" s on s."id" = u."schoolId"
where lower(u."email") = 'admin@test.local';
