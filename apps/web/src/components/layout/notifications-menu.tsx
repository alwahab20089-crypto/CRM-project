import { Bell } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/hooks/use-crm-queries';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/common/empty-state';

export function NotificationsMenu() {
  const { data = [], isLoading } = useNotifications();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const isRead = (id: string, readAt: string | null) => readAt !== null || readIds.has(id);
  const unread = data.filter((n) => !isRead(n._id, n.readAt)).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread} unread`}>
          <Bell className="size-4" aria-hidden />
          {unread > 0 && <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive ring-2 ring-card" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <Button variant="ghost" size="sm" disabled={unread === 0} onClick={() => setReadIds(new Set(data.map((n) => n._id)))}>
            Mark all read
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : data.length === 0 ? (
          <EmptyState icon={Bell} title="You're all caught up" description="New notifications will appear here." />
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {data.map((n) => (
              <li key={n._id} className={cn('px-4 py-3', !isRead(n._id, n.readAt) && 'bg-primary/5')}>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="text-caption mt-1">{formatRelative(n.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}