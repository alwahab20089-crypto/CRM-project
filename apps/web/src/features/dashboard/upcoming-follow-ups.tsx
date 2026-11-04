import { AsyncCard } from '@/components/common/async-card';
import { EmptyState } from '@/components/common/empty-state';
import { StatusBadge } from '@/components/common/status-badge';
import { useFollowUps } from '@/hooks/use-crm-queries';
import { formatDateTime } from '@/lib/format';

export function UpcomingFollowUps() {
  const { data = [], isLoading, isError, refetch } = useFollowUps();
  return (
    <AsyncCard
      title="Upcoming follow-ups"
      description="Next actions for your team"
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      skeletonHeight="h-72"
    >
      {data.length === 0 ? (
        <EmptyState title="No follow-ups scheduled" description="You are all caught up." />
      ) : (
        <ul className="divide-y">
          {data.map((item) => (
            <li key={item._id} className="space-y-1 py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{item.contactName}</p>
                <StatusBadge status={item.priority} />
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <p className="text-caption">
                <time dateTime={item.dueDate}>{formatDateTime(item.dueDate)}</time> · {item.assignee?.name ?? 'Unassigned'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AsyncCard>
  );
}