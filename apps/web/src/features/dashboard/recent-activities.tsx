import { ActivityTimeline } from '@/components/common/activity-timeline';
import { AsyncCard } from '@/components/common/async-card';
import { EmptyState } from '@/components/common/empty-state';
import { useActivities } from '@/hooks/use-crm-queries';

export function RecentActivities() {
  const { data = [], isLoading, isError, refetch } = useActivities();
  return (
    <AsyncCard
      title="Recent activity"
      description="What your team has been up to"
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      skeletonHeight="h-72"
    >
      {data.length === 0 ? (
        <EmptyState title="No activity yet" description="Calls, notes and status changes will show up here." />
      ) : (
        <ActivityTimeline items={data.slice(0, 5)} />
      )}
    </AsyncCard>
  );
}