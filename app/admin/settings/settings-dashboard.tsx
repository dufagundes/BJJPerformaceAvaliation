import Link from "next/link";
import { Icon } from "../../dashboard/_components/icons";

const settingCards = [
  {
    title: "Contacts",
    description: "Manage parent and student contacts used for evaluation invitations.",
    footer: "View, add, edit, or import contacts.",
    href: "/admin/contacts",
    icon: "employees" as const,
  },
  {
    title: "Schools & Admins",
    description: "Create pilot schools and administrator accounts.",
    footer: "Manage schools, admins, and permissions.",
    href: "/admin/schools-admins",
    icon: "settings" as const,
  },
  {
    title: "Scorecard Builder",
    description: "Edit evaluation questions, audiences, options, and scorecard setup.",
    footer: "Build and customize evaluation scorecards.",
    href: "/admin/scorecard-builder",
    icon: "goals" as const,
  },
  {
    title: "Evaluation Defaults",
    description: "Configure default values, reminders, score weights, and evaluation rules.",
    footer: "Set defaults for scores, reminders, and weights.",
    href: "/admin/evaluation-defaults",
    icon: "reviews" as const,
  },
  {
    title: "Test Email",
    description: "Send a test message to confirm outbound email delivery.",
    footer: "Verify email configuration and delivery.",
    href: "/admin/test-email",
    icon: "feedback" as const,
  },
];

const helpLinks = ["Getting Started Guide", "Evaluation Best Practices", "Video Tutorials"];

export default function SettingsDashboard() {
  return (
    <main className="space-y-8">
      <header className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
              <ol className="flex items-center gap-2">
                <li>Home</li>
                <li aria-hidden="true">/</li>
                <li className="font-medium text-slate-900">Admin Settings</li>
              </ol>
            </nav>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Admin Settings</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Configure default values and system settings for future evaluation cycles.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              aria-label="View notifications"
              className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <Icon name="bell" className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-blue-600" />
            </button>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              <span className="text-xs uppercase tracking-wide text-slate-500">School</span>
              <select className="bg-transparent text-sm font-semibold text-slate-950 outline-none">
                <option>GB Lindale</option>
                <option>Pilot School</option>
              </select>
            </label>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="settings-grid-title" className="space-y-4">
          <h2 id="settings-grid-title" className="sr-only">Settings sections</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {settingCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group flex min-h-48 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                    <Icon name={card.icon} className="h-6 w-6" />
                  </span>
                  <span aria-hidden="true" className="text-2xl leading-none text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600">
                    &rarr;
                  </span>
                </div>
                <div className="mt-5 flex-1">
                  <h3 className="text-lg font-semibold text-slate-950">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                </div>
                <p className="mt-5 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">{card.footer}</p>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="help-title">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon name="help" className="h-5 w-5" />
              </span>
              <h2 id="help-title" className="text-base font-semibold text-slate-950">Need help?</h2>
            </div>
            <div className="mt-4 divide-y divide-slate-100">
              {helpLinks.map((item) => (
                <a key={item} href="#" className="block py-3 text-sm font-medium text-slate-700 transition hover:text-blue-700">
                  {item}
                </a>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="status-title">
            <h2 id="status-title" className="text-base font-semibold text-slate-950">System Status</h2>
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                All systems operational
              </p>
              <p className="mt-2 text-xs text-emerald-700">Last updated: May 25, 2025 9:30 AM</p>
            </div>
          </section>
        </aside>
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-200 pt-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>&copy; 2025 Gracie Barra Lindale. All rights reserved.</p>
        <nav aria-label="Footer links" className="flex flex-wrap gap-4">
          <a href="#" className="transition hover:text-blue-700">Privacy Policy</a>
          <a href="#" className="transition hover:text-blue-700">Terms of Service</a>
          <a href="#" className="transition hover:text-blue-700">Support</a>
        </nav>
      </footer>
    </main>
  );
}