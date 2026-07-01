import "bootstrap/dist/css/bootstrap-grid.min.css";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppShell from "../components/app-shell";

export const metadata: Metadata = {
  title: "Gb Staff Performance",
  description: "Quarterly staff performance scorecards",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
