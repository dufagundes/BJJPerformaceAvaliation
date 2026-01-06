import "./globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "GB Kids Evaluation",
  description: "GB Kids Student Performance Evaluation System"
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <header>
          <h1>GB Kids Student Performance Evaluation</h1>
          <nav>
            <Link href="/">Dashboard</Link>
            <Link href="/students">Students</Link>
            <Link href="/criteria">Criteria</Link>
            <Link href="/evaluations">Evaluations</Link>
            {session ? (
              <span>Signed in as {session.user?.email}</span>
            ) : (
              <Link href="/auth/signin">Sign in</Link>
            )}
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
