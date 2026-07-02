-- Reset the test admin login for Supabase SQL Editor.
-- Login after running:
--   email: admin@test.local
--   password: Admin123!

begin;

with target_school as (
  insert into "School" ("id", "name", "isActive", "createdAt", "updatedAt")
  values (gen_random_uuid(), 'Default School', true, now(), now())
  on conflict ("name")
  do update set "isActive" = true, "updatedAt" = now()
  returning "id"
), reset_user as (
  insert into "User" (
    "id",
    "schoolId",
    "name",
    "email",
    "passwordHash",
    "role",
    "isActive",
    "createdAt"
  )
  select
    gen_random_uuid(),
    target_school."id",
    'Test Admin',
    'admin@test.local',
    '$2a$12$tDFMZWvrcksmv9sL..mq..nzXH5j0UhviNz3svvrpOAPwyMxXIB16',
    'ADMIN'::"UserRole",
    true,
    now()
  from target_school
  on conflict ("schoolId", "email")
  do update set
    "name" = excluded."name",
    "passwordHash" = excluded."passwordHash",
    "role" = excluded."role",
    "isActive" = true
  returning "id", "schoolId", "email", "role", "isActive"
)
insert into "AdminConfig" (
  "id",
  "schoolId",
  "defaultCycleDurationDays",
  "defaultContactsToInvite",
  "reminderScheduleDaysBefore",
  "updatedAt"
)
select
  gen_random_uuid(),
  reset_user."schoolId",
  15,
  5,
  array[3, 1],
  now()
from reset_user
on conflict ("schoolId") do nothing;

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
