-- Launch cleanup script for Supabase SQL Editor.
-- Purpose: remove test/user-entered data before creating the first real school.
-- This preserves schema and migrations. School-specific questions, scorecard weights,
-- and app configuration are removed with their school and regenerated from app defaults for new schools.
-- Review carefully before running against production.

begin;

-- Child records first. Some rows would cascade, but explicit deletes make the cleanup easy to audit.
delete from "SelfEvaluation";
delete from "EvaluationResponse";
delete from "Reviewer";
delete from "EvaluationCycle";
delete from "StaffMember";
delete from "Contact";
delete from "AdminConfig";
delete from "User";
delete from "School";

-- Optional verification: all counts should be zero before commit.
do $$
declare
  remaining_count integer;
begin
  select
    (select count(*) from "SelfEvaluation") +
    (select count(*) from "EvaluationResponse") +
    (select count(*) from "Reviewer") +
    (select count(*) from "EvaluationCycle") +
    (select count(*) from "StaffMember") +
    (select count(*) from "Contact") +
    (select count(*) from "AdminConfig") +
    (select count(*) from "User") +
    (select count(*) from "School")
  into remaining_count;

  if remaining_count <> 0 then
    raise exception 'Cleanup verification failed. Remaining launch data rows: %', remaining_count;
  end if;
end $$;

commit;
