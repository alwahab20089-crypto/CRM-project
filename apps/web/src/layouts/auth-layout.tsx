import { BarChart3, BellRing, ShieldCheck } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { Logo } from '@/components/common/logo';

const highlights = [
  { icon: BarChart3, title: 'Pipeline at a glance', text: 'See every lead, listing and deal in one clear dashboard.' },
  { icon: BellRing, title: 'Never miss a follow-up', text: 'Reminders and tasks keep your team on top of every client.' },
  { icon: ShieldCheck, title: 'Built for teams', text: 'Roles, invitations and organization-level data isolation.' },
];

export function AuthLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <Link to="/login" className="w-fit rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="EstateFlow home">
          <Logo />
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <Outlet />
        </div>
        <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} EstateFlow CRM</p>
      </div>

      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-brand/20 blur-3xl" aria-hidden />
        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight">
            The calm, modern CRM for real estate teams.
          </h2>
          <p className="mt-3 text-sidebar-muted">From the first inquiry to the closed deal, without enterprise complexity.</p>
        </div>
        <ul className="relative max-w-md space-y-6">
          {highlights.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-brand">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-sidebar-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}