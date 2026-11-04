import { useState } from 'react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/common/error-state';
import { StatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlans, useSubscriptionOverview } from '@/hooks/use-crm-queries';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import type { Plan } from '@/types';

function UsageMeter({ label, used, limit, unit = '' }: { label: string; used: number; limit: number | null; unit?: string }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {formatNumber(used)}
          {unit} / {limit ? `${formatNumber(limit)}${unit}` : 'Unlimited'}
        </span>
      </div>
      <Progress value={pct} aria-label={`${label} usage`} className={pct >= 80 ? '[&>div]:bg-warning' : undefined} />
    </div>
  );
}

function PlanOption({ plan, current, onSelect }: { plan: Plan; current: boolean; onSelect: () => void }) {
  const limit = (v: number | null) => (v === null ? 'Unlimited' : formatNumber(v));
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <p className="font-semibold">{plan.name}</p>
        <p className="text-2xl font-semibold tabular-nums">
          {formatCurrency(plan.price / 100, plan.currency)}
          <span className="text-sm font-normal text-muted-foreground">/mo</span>
        </p>
      </div>
      <ul className="space-y-1 text-sm text-muted-foreground">
        <li>{limit(plan.limits.users)} users</li>
        <li>{limit(plan.limits.leads)} leads</li>
        <li>{limit(plan.limits.properties)} properties</li>
      </ul>
      <Button variant={current ? 'secondary' : 'default'} disabled={current} onClick={onSelect} className="mt-auto">
        {current ? 'Current plan' : `Choose ${plan.name}`}
      </Button>
    </div>
  );
}

export function SubscriptionSettings() {
  const { data, isLoading, isError, refetch } = useSubscriptionOverview();
  const { data: plans = [] } = usePlans();
  const [open, setOpen] = useState(false);

  if (isError) {
    return (
      <Card>
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }
  if (isLoading || !data) return <Skeleton className="h-96 w-full" aria-busy="true" />;

  const { plan, subscription, usage } = data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-section-title">Subscription</CardTitle>
            <CardDescription>Demo data. Billing is connected in a later phase.</CardDescription>
          </div>
          <Button onClick={() => setOpen(true)}>Upgrade plan</Button>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-caption">Current plan</p>
            <p className="text-lg font-semibold">{plan.name}</p>
            <p className="text-sm text-muted-foreground">{formatCurrency(plan.price / 100, plan.currency)} / month</p>
          </div>
          <div>
            <p className="text-caption">Billing status</p>
            <div className="mt-1">
              <StatusBadge status={subscription.status} />
            </div>
          </div>
          <div>
            <p className="text-caption">Next renewal</p>
            <p className="text-lg font-semibold">{formatDate(subscription.currentPeriodEnd)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-section-title">Plan usage</CardTitle>
          <CardDescription>How much of your plan limits you are using.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <UsageMeter label="Team members" used={usage.users} limit={plan.limits.users} />
          <UsageMeter label="Leads" used={usage.leads} limit={plan.limits.leads} />
          <UsageMeter label="Properties" used={usage.properties} limit={plan.limits.properties} />
          <UsageMeter label="Storage" used={usage.storageMb} limit={plan.limits.storageMb} unit=" MB" />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose a plan</DialogTitle>
            <DialogDescription>Compare plans. Checkout is not connected yet.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((p) => (
              <PlanOption
                key={p._id}
                plan={p}
                current={p._id === plan._id}
                onSelect={() => {
                  setOpen(false);
                  toast.info('Billing checkout arrives with the SaaS commercial layer (Phase 8).');
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}