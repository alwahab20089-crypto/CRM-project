import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-brand-foreground">
        <Building2 className="size-4.5" aria-hidden />
      </span>
      {!collapsed && <span className="text-base font-semibold tracking-tight">EstateFlow</span>}
      {collapsed && <span className="sr-only">EstateFlow</span>}
    </div>
  );
}