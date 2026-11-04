import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AsyncCard } from '@/components/common/async-card';
import { useDashboard } from '@/hooks/use-crm-queries';
import { chartColors, tooltipStyle } from '@/lib/chart';
import { formatNumber } from '@/lib/format';
import { leadSourceLabels } from '@/lib/labels';

export function LeadSourceChart() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const sources = (data?.leadSources ?? []).map((s, i) => ({
    name: leadSourceLabels[s.source],
    value: s.count,
    color: chartColors[i % chartColors.length]!,
  }));
  const total = sources.reduce((sum, s) => sum + s.value, 0);

  return (
    <AsyncCard
      title="Lead sources"
      description="Where your leads come from"
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      skeletonHeight="h-72"
    >
      <div role="img" aria-label={`Donut chart of ${total} leads by source`} className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip contentStyle={tooltipStyle} />
            <Pie data={sources} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">
              {sources.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {sources.map((s) => (
          <li key={s.name} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
            <span className="truncate">{s.name}</span>
            <span className="ml-auto text-muted-foreground tabular-nums">{formatNumber(s.value)}</span>
          </li>
        ))}
      </ul>
    </AsyncCard>
  );
}