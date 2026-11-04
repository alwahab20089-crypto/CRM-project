import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { UserAvatar } from '@/components/common/user-avatar';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeads } from '@/hooks/use-crm-queries';
import { fullName } from '@/lib/format';
import { humanize, leadSourceLabels } from '@/lib/labels';
import type { LeadStatus } from '@/types';

const stages: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING_SCHEDULED', 'NEGOTIATION', 'WON', 'LOST'];

export function PipelinePage() {
  const { data = [], isLoading, isError, refetch } = useLeads();

  return (
    <>
      <PageHeader title="Pipeline" description="Leads grouped by stage. Drag-and-drop arrives with the CRUD phase." />
      {isError ? (
        <Card>
          <ErrorState onRetry={() => refetch()} />
        </Card>
      ) : (
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          {stages.map((stage) => {
            const items = data.filter((l) => l.status === stage);
            return (
              <section key={stage} aria-label={humanize(stage)} className="w-72 shrink-0 snap-start rounded-xl bg-muted/60 p-3">
                <header className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold">{humanize(stage)}</h2>
                  <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground tabular-nums">{isLoading ? '–' : items.length}</span>
                </header>
                <ul className="space-y-2">
                  {isLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : items.length === 0 ? (
                    <li className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">No leads</li>
                  ) : (
                    items.map((lead) => (
                      <li key={lead._id}>
                        <Card className="gap-2 p-3 shadow-none">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">{fullName(lead)}</p>
                            <StatusBadge status={lead.priority} />
                          </div>
                          <p className="text-caption">{leadSourceLabels[lead.leadSource]}</p>
                          <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                            <UserAvatar name={lead.assignee?.name ?? '?'} className="size-5" />
                            {lead.assignee?.name ?? 'Unassigned'}
                          </div>
                        </Card>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}