-- Preview contacts for the school owned by info@gblindale.com.
-- Run this first in Supabase SQL Editor before running delete-contacts-for-info-gblindale.sql.

select
  s."name" as school_name,
  s."id" as school_id,
  c."id" as contact_id,
  c."type",
  c."name",
  c."email",
  c."studentName",
  c."isActive",
  c."createdAt",
  exists (
    select 1
    from "Reviewer" r
    where r."contactId" = c."id"
  ) as is_linked_to_evaluation
from "User" u
join "School" s on s."id" = u."schoolId"
join "Contact" c on c."schoolId" = s."id"
where lower(u."email") = 'info@gblindale.com'
  and u."isActive" = true
  and s."isActive" = true
order by c."createdAt" desc, c."name" asc;

select
  s."name" as school_name,
  count(c."id") as total_contacts,
  count(c."id") filter (where c."isActive" = true) as active_contacts,
  count(c."id") filter (where c."isActive" = false) as inactive_contacts,
  count(c."id") filter (
    where exists (
      select 1
      from "Reviewer" r
      where r."contactId" = c."id"
    )
  ) as linked_to_evaluations
from "User" u
join "School" s on s."id" = u."schoolId"
left join "Contact" c on c."schoolId" = s."id"
where lower(u."email") = 'info@gblindale.com'
  and u."isActive" = true
  and s."isActive" = true
group by s."id", s."name";