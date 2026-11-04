import { ActivityTimeline } from '@/components/common/activity-timeline';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivities } from '@/hooks/use-crm-queries';

export function ActivitiesPage() {
  const { data = [], isLoading, isError, refetch } = useActivities();
  return (
    <>
      <PageHeader title="Activities" description="A timeline of everything happening across your CRM." />
      <Card>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" aria-busy="true" />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : data.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <ActivityTimeline items={data} />
          )}
        </CardContent>
      </Card>
    </>
  );
}