import { NavLink } from 'react-router-dom';
import { Logo } from '@/components/common/logo';
import { UserAvatar } from '@/components/common/user-avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useActiveOrganization, useCurrentUser } from '@/hooks/use-crm-queries';
import { cn } from '@/lib/utils';
import { navGroups, type NavItem } from './nav-config';

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

function SidebarLink({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const link = (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
        )
      }
    >
      <item.icon className="size-4 shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function SidebarUser({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { data: user } = useCurrentUser();
  const { organization } = useActiveOrganization();
  const name = user?.name ?? 'Loading…';
  const link = (
    <NavLink
      to="/app/settings?tab=profile"
      onClick={onNavigate}
      aria-label={collapsed ? `${name} profile` : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md p-2 outline-none hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        collapsed && 'justify-center',
      )}
    >
      <UserAvatar name={name} className="size-8" />
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-sidebar-muted">{organization?.name ?? ''}</p>
        </div>
      )}
    </NavLink>
  );
  return (
    <div className="border-t border-sidebar-border p-3">
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{name}</TooltipContent>
        </Tooltip>
      ) : (
        link
      )}
    </div>
  );
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn('flex h-14 shrink-0 items-center border-b border-sidebar-border px-4', collapsed && 'justify-center px-0')}>
        <Logo collapsed={collapsed} />
      </div>
      <nav aria-label="Main navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {navGroups.map((group, index) => (
          <div key={group.label}>
            {collapsed ? (
              index > 0 && <Separator className="mb-3 bg-sidebar-border" />
            ) : (
              <p className="mb-1.5 px-2.5 text-xs font-medium tracking-wider text-sidebar-muted uppercase">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <SidebarLink item={item} collapsed={collapsed} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <SidebarUser collapsed={collapsed} onNavigate={onNavigate} />
    </div>
  );
}