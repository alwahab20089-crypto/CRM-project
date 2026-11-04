import { PageHeader } from '@/components/common/page-header';
import { useCurrentUser } from '@/hooks/use-crm-queries';
import { getGreeting } from '@/lib/format';
import { KpiGrid } from './kpi-grid';
import { LeadGenerationChart } from './lead-generation-chart';
import { LeadSourceChart } from './lead-source-chart';
import { PipelineChart } from './pipeline-chart';
import { RecentActivities } from './recent-activities';
import { RecentLeadsTable } from './recent-leads-table';
import { UpcomingFollowUps } from './upcoming-follow-ups';

export function DashboardPage() {
  const { data: user } = useCurrentUser();
  const firstName = user?.name.split(' ')[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${getGreeting()}${firstName ? `, ${firstName}` : ''}`}
        description="Here's what's happening with your real estate business today."
      />
      <KpiGrid />
      <div className="grid gap-4 lg:grid-cols-3">
        <LeadGenerationChart />
        <LeadSourceChart />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <PipelineChart />
        <UpcomingFollowUps />
        <RecentActivities />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <RecentLeadsTable />
      </div>
    </div>
  );
}