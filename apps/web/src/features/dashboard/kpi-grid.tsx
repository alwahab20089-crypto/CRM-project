import { Building2, Clock, Target, UserCheck, type LucideIcon } from 'lucide-react';
import { StatCard } from '@/components/common/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/error-state';
import { useDashboard } from '@/hooks/use-crm-queries';
import { formatNumber } from '@/lib/format';
import type { Kpi } from '@/types';

const icons: Record<Kpi['key'], LucideIcon> = {
  totalLeads: Target,
  activeProperties: Building2,
  convertedCustomers: UserCheck,
  pendingFollowUps: Clock,
};

export function KpiGrid() {
  const { data, isLoading, isError, refetch } = useDashboard();

  if (isError) {
    return (
      <Card>
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  return (
    <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {isLoading || !data
        ? Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="py-5" aria-busy="true">
              <CardContent className="space-y-3 px-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))
        : data.kpis.map((kpi) => (
            <StatCard
              key={kpi.key}
              label={kpi.label}
              value={formatNumber(kpi.value)}
              icon={icons[kpi.key]}
              changePct={kpi.changePct}
              comparison={`vs ${formatNumber(kpi.previousValue)} previous 30 days`}
              helper={kpi.helper}
              positiveIsGood={kpi.positiveIsGood}
            />
          ))}
    </section>
  );
}