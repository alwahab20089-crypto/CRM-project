import {
  Building2, CalendarClock, FileText, Mail, Pencil, Phone, Repeat, UserCheck, UserPlus, Users, Zap, type LucideIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingButton } from '@/components/common/loading-button';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { errorMessage } from '@/lib/errors';
import { formatRelative } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import type { LeadActivityType } from '@/types/leads';
import { useAddLeadNote, useLeadActivities } from './use-leads';

const icons: Record<LeadActivityType, LucideIcon> = {
  CREATED: UserPlus, UPDATE: Pencil, STATUS_CHANGE: Repeat, ASSIGNMENT: UserCheck, NOTE: FileText,
  FOLLOW_UP: CalendarClock, CALL: Phone, EMAIL: Mail, MEETING: Users, PROPERTY_VIEWING: Building2, OTHER: Zap,
};
const NOTE_MAX = 2000;
const PAGE = 20;

export function NoteComposer({ leadId, inputRef }: { leadId: string; inputRef?: React.Ref<HTMLTextAreaElement> }) {
  const [body, setBody] = useState('');
  const add = useAddLeadNote();
  const trimmed = body.trim();

  const submit = async () => {
    if (!trimmed || add.isPending) return;
    try {
      await add.mutateAsync({ id: leadId, body: trimmed });
      setBody('');
      toast.success('Note added');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not add the note'));
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="lead-note" className="sr-only">
        Add a note
      </label>
      <Textarea id="lead-note" ref={inputRef} rows={3} maxLength={NOTE_MAX} placeholder="Add a note about this lead…" value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex items-center justify-between">
        <span className="text-caption">{body.length}/{NOTE_MAX}</span>
        <LoadingButton size="sm" onClick={submit} loading={add.isPending} disabled={!trimmed}>
          Add note
        </LoadingButton>
      </div>
    </div>
  );
}

export function LeadActivityTimeline({ leadId, canNote, noteRef }: { leadId: string; canNote: boolean; noteRef?: React.Ref<HTMLTextAreaElement> }) {
  const { can } = useAuth();
  const [tab, setTab] = useState<'all' | 'NOTE'>('all');
  const [limit, setLimit] = useState(PAGE);
  const query = useLeadActivities(leadId, tab === 'NOTE' ? 'NOTE' : undefined, limit);
  const items = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const lastRef = useRef(0);
  lastRef.current = items.length;

  return (
    <div className="space-y-4">
      {canNote && can('activities:create') && <NoteComposer leadId={leadId} inputRef={noteRef} />}
      <Tabs value={tab} onValueChange={(v) => { setTab(v as 'all' | 'NOTE'); setLimit(PAGE); }}>
        <TabsList aria-label="Activity filter">
          <TabsTrigger value="all">All activity</TabsTrigger>
          <TabsTrigger value="NOTE">Notes</TabsTrigger>
        </TabsList>
      </Tabs>

      {query.isLoading ? (
        <div aria-busy="true" aria-label="Loading activity" className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : query.isError ? (
        <ErrorState message={errorMessage(query.error, 'Could not load activity.')} onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title={tab === 'NOTE' ? 'No notes yet' : 'No activity yet'} description="Notes and changes will appear here." />
      ) : (
        <>
          <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-4 before:w-px before:bg-border">
            {items.map((item) => {
              const Icon = icons[item.activityType] ?? Zap;
              return (
                <li key={item._id} className="relative flex gap-3">
                  <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border bg-card text-muted-foreground">
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm break-words whitespace-pre-wrap">{item.description}</p>
                    <p className="text-caption">
                      {item.user?.name ?? 'Former member'} · <time dateTime={item.createdAt}>{formatRelative(item.createdAt)}</time>
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          {items.length < total && (
            <Button variant="outline" size="sm" onClick={() => setLimit((l) => l + PAGE)}>
              Show more
            </Button>
          )}
        </>
      )}
    </div>
  );
}