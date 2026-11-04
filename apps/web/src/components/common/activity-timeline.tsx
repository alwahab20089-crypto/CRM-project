import { CalendarClock, FileText, Mail, MessageSquare, Phone, Repeat, Users, Zap, type LucideIcon } from 'lucide-react';
import { formatRelative } from '@/lib/format';
import type { ActivityListItem, ActivityType } from '@/types';

const icons: Record<ActivityType, LucideIcon> = {
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Users,
  NOTE: FileText,
  STATUS_CHANGE: Repeat,
  FOLLOW_UP: CalendarClock,
  PROPERTY_VIEWING: MessageSquare,
  OTHER: Zap,
};

export function ActivityTimeline({ items }: { items: ActivityListItem[] }) {
  return (
    <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-4 before:w-px before:bg-border">
      {items.map((item) => {
        const Icon = icons[item.activityType];
        return (
          <li key={item._id} className="relative flex gap-3">
            <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border bg-card text-muted-foreground">
              <Icon className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm">{item.description}</p>
              <p className="text-caption">
                {item.user?.name ?? 'System'} · <time dateTime={item.createdAt}>{formatRelative(item.createdAt)}</time>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}