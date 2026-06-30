import { UserRole } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      schoolId: string;
      schoolName?: string | null;
      name?: string | null;
      email?: string | null;
    };
  }

  interface User {
    role: UserRole;
    schoolId: string;
    schoolName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    schoolId?: string;
    schoolName?: string | null;
  }
}