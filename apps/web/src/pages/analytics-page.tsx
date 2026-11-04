import { PageHeader } from '@/components/common/page-header';
import { KpiGrid } from '@/features/dashboard/kpi-grid';
import { LeadGenerationChart } from '@/features/dashboard/lead-generation-chart';
import { LeadSourceChart } from '@/features/dashboard/lead-source-chart';
import { PipelineChart } from '@/features/dashboard/pipeline-chart';

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Performance across leads, sources and your pipeline." />
      <KpiGrid />
      <div className="grid gap-4 lg:grid-cols-3">
        <LeadGenerationChart />
        <LeadSourceChart />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <PipelineChart />
      </div>
    </div>
  );
}