import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AsyncCard } from '@/components/common/async-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboard } from '@/hooks/use-crm-queries';
import { axisTick, tooltipStyle } from '@/lib/chart';

type Range = 'monthly' | 'weekly';

export function LeadGenerationChart() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const [range, setRange] = useState<Range>('monthly');
  const series = data?.leadsOverTime[range] ?? [];
  const total = series.reduce((sum, p) => sum + p.value, 0);

  return (
    <AsyncCard
      title="Lead generation"
      description={range === 'monthly' ? 'New leads per month, last 12 months' : 'New leads per week, last 8 weeks'}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      skeletonHeight="h-72"
      className="lg:col-span-2"
      action={
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList aria-label="Chart range">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      <div role="img" aria-label={`Area chart: ${total} leads generated over the selected ${range} range`} className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, 'Leads']} />
            <Area type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} fill="url(#leadsFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AsyncCard>
  );
}