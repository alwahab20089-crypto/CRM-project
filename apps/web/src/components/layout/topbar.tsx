import { PanelLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Breadcrumbs } from './breadcrumbs';
import { NotificationsMenu } from './notifications-menu';
import { OrgSwitcher } from './org-switcher';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);

interface TopbarProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
}

export function Topbar({ onToggleSidebar, onOpenSearch }: TopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-3 sm:px-4">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <PanelLeft className="size-4" aria-hidden />
      </Button>
      <Separator orientation="vertical" className="hidden h-5 sm:block" />
      <Breadcrumbs />
      <div className="flex-1" />
      <Button
        variant="outline"
        onClick={onOpenSearch}
        className="hidden w-64 justify-between font-normal text-muted-foreground md:flex"
        aria-label="Open global search"
      >
        <span className="flex items-center gap-2">
          <Search className="size-4" aria-hidden /> Search…
        </span>
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
      </Button>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenSearch} aria-label="Open global search">
        <Search className="size-4" aria-hidden />
      </Button>
      <OrgSwitcher />
      <NotificationsMenu />
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}