import { Badge } from '@/components/ui/badge';
import { humanize } from '@/lib/labels';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand';

const toneClass: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  brand: 'bg-brand/15 text-foreground',
};

const tones: Record<string, Tone> = {
  // lead status
  NEW: 'info',
  CONTACTED: 'neutral',
  QUALIFIED: 'brand',
  MEETING_SCHEDULED: 'warning',
  NEGOTIATION: 'warning',
  WON: 'success',
  LOST: 'danger',
  // priority
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
  // task status
  OPEN: 'info',
  IN_PROGRESS: 'warning',
  DONE: 'success',
  CANCELLED: 'neutral',
  // listing status
  AVAILABLE: 'success',
  RESERVED: 'warning',
  SOLD: 'neutral',
  RENTED: 'neutral',
  INACTIVE: 'neutral',
  // generic
  ACTIVE: 'success',
  SUSPENDED: 'danger',
  PENDING: 'warning',
  TRIALING: 'info',
  PAST_DUE: 'danger',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn('border-transparent font-medium', toneClass[tones[status] ?? 'neutral'], className)}>
      {humanize(status)}
    </Badge>
  );
}