export const STAFF_ROLES = [
  "Front Desk",
  "Professor",
  "Coach",
  "Cleaner",
  "Youth Apprentice",
  "Head Instructor",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];