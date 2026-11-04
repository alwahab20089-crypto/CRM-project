import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  changePct: number;
  comparison: string;
  helper: string;
  positiveIsGood?: boolean;
}

export function StatCard({ label, value, icon: Icon, changePct, comparison, helper, positiveIsGood = true }: StatCardProps) {
  const up = changePct >= 0;
  const good = up === positiveIsGood;
  const TrendIcon = up ? TrendingUp : TrendingDown;

  return (
    <Card className="gap-3 py-5">
      <CardContent className="space-y-3 px-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4.5" aria-hidden />
          </span>
        </div>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
              good ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
            )}
          >
            <TrendIcon className="size-3" aria-hidden />
            <span className="sr-only">{up ? 'Up' : 'Down'} </span>
            {Math.abs(changePct).toFixed(1)}%
          </span>
          <span className="text-muted-foreground">{comparison}</span>
        </div>
        <p className="text-caption">{helper}</p>
      </CardContent>
    </Card>
  );
}