import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AsyncCard } from '@/components/common/async-card';
import { useDashboard } from '@/hooks/use-crm-queries';
import { axisTick, pipelineColors, tooltipStyle } from '@/lib/chart';
import { humanize } from '@/lib/labels';

export function PipelineChart() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const stages = (data?.pipeline ?? []).map((p) => ({ ...p, label: humanize(p.status) }));

  return (
    <AsyncCard
      title="Sales pipeline"
      description="Leads by stage"
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      skeletonHeight="h-72"
    >
      <div role="img" aria-label="Bar chart of leads by pipeline stage" className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stages} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="label" width={88} tickLine={false} axisLine={false} tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)' }} formatter={(value) => [value, 'Leads']} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
              {stages.map((s) => (
                <Cell key={s.status} fill={pipelineColors[s.status]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AsyncCard>
  );
}