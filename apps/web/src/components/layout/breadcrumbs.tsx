import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { navGroups } from './nav-config';

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const group = navGroups.find((g) => g.items.some((i) => pathname.startsWith(i.to)));
  const item = group?.items.find((i) => pathname.startsWith(i.to));
  if (!group || !item) return null;

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        <li className="hidden items-center gap-1.5 sm:flex">
          <Link to="/app/dashboard" className="text-muted-foreground hover:text-foreground">
            {group.label}
          </Link>
          <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
        </li>
        <li aria-current="page" className="truncate font-medium">
          {item.label}
        </li>
      </ol>
    </nav>
  );
}