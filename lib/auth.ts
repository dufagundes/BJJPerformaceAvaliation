import { UserRole } from "@prisma/client";
import { compare } from "bcryptjs";
// @ts-ignore
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        if (!email || !password) {
          return null;
        }

        const users = await prisma.user.findMany({
          where: {
            email,
            role: UserRole.ADMIN,
            isActive: true,
            school: {
              is: {
                isActive: true,
              },
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            schoolId: true,
            isActive: true,
            school: {
              select: {
                name: true,
                isActive: true,
              },
            },
          },
        });

        if (users.length !== 1) {
          return null;
        }

        const user = users[0];

        if (!user || user.role !== UserRole.ADMIN || !user.isActive || !user.school.isActive) {
          return null;
        }

        const isValidPassword = await compare(password, user.passwordHash);
        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
          schoolName: user.school.name,
        };
      },
    }),
  ],
  // @ts-ignore
  callbacks: {
    // @ts-ignore
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.schoolName = user.schoolName;
        token.sub = user.id;
      }

      return token;
    },
    // @ts-ignore
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.role = (token.role as UserRole) || UserRole.STAFF;
        session.user.schoolId = token.schoolId || "";
        session.user.schoolName = token.schoolName;
      }

      return session;
    },
  },
};