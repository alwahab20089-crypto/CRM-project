import { ArrowLeft, CalendarClock, MessageSquarePlus, Pencil, Repeat, Trash2, UserCheck, ArchiveRestore } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { StatusBadge } from '@/components/common/status-badge';
import { UserAvatar } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { errorMessage } from '@/lib/errors';
import { formatDate, formatDateTime } from '@/lib/format';
import { humanize, leadSourceLabels } from '@/lib/labels';
import { formatBudget } from '@/lib/money';
import { useAuth } from '@/providers/auth-provider';
import { LeadActivityTimeline } from './lead-activity-timeline';
import { LeadAssignDialog } from './lead-assign-dialog';
import { LeadFollowUpDialog } from './lead-followup-dialog';
import { LeadFormDialog } from './lead-form-dialog';
import { LeadStatusDialog } from './lead-status-dialog';
import { useDeleteLead, useLead, useRestoreLead } from './use-leads';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-caption">{label}</dt>
      <dd className="mt-0.5 text-sm break-words">{children || '—'}</dd>
    </div>
  );
}

export function LeadDetailPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const { data: lead, isLoading, isError, error, refetch } = useLead(leadId);
  const del = useDeleteLead();
  const restore = useRestoreLead();
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const [dialog, setDialog] = useState<'edit' | 'status' | 'assign' | 'followup' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading lead" className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }
  if (isError || !lead) {
    const notFound = error instanceof ApiError && error.status === 404;
    return notFound ? (
      <EmptyState
        title="Lead not found"
        description="It may have been deleted, or you may not have access to it."
        action={<Button asChild variant="outline"><Link to="/app/leads">Back to leads</Link></Button>}
      />
    ) : (
      <ErrorState message={errorMessage(error, 'We could not load this lead.')} onRetry={() => refetch()} />
    );
  }

  const name = `${lead.firstName} ${lead.lastName}`.trim();
  const archived = lead.deletedAt !== null;
  const canUpdate = can('leads:update') && !archived;

  const onDelete = async () => {
    try {
      await del.mutateAsync(lead._id);
      toast.success('Lead archived');
      navigate('/app/leads', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete the lead'));
    }
  };
  const onRestore = async () => {
    try {
      await restore.mutateAsync(lead._id);
      toast.success('Lead restored');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not restore the lead'));
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/app/leads" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Leads
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar name={name} className="size-14 text-lg" />
          <div>
            <h1 className="text-page-title">{name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <StatusBadge status={lead.status} />
              <StatusBadge status={lead.priority} />
              <span className="text-sm text-muted-foreground">Added {formatDate(lead.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdate && <Button variant="outline" onClick={() => setDialog('edit')}><Pencil /> Edit</Button>}
          {canUpdate && <Button variant="outline" onClick={() => setDialog('status')}><Repeat /> Change status</Button>}
          {canUpdate && can('leads:assign') && <Button variant="outline" onClick={() => setDialog('assign')}><UserCheck /> Reassign</Button>}
          {canUpdate && <Button variant="outline" onClick={() => setDialog('followup')}><CalendarClock /> Follow-up</Button>}
          {canUpdate && <Button variant="outline" onClick={() => noteRef.current?.focus()}><MessageSquarePlus /> Add note</Button>}
          {can('leads:delete') && !archived && (
            <Button variant="outline" className="text-destructive" onClick={() => setConfirmDelete(true)}><Trash2 /> Archive lead</Button>
          )}
          {can('leads:delete') && archived && <Button onClick={onRestore}><ArchiveRestore /> Restore</Button>}
        </div>
      </div>

      {archived && (
        <div role="status" className="rounded-md bg-warning/15 px-4 py-3 text-sm text-warning">
          This lead is archived. Restore it to make changes.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-section-title">Contact</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <Field label="Phone">{<a className="hover:underline" href={`tel:${lead.phone}`}>{lead.phone}</a>}</Field>
                <Field label="Alternate phone">{lead.alternatePhone}</Field>
                <Field label="Email">{lead.email && <a className="hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a>}</Field>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-section-title">Requirements</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <Field label="Lead type">{humanize(lead.leadType)}</Field>
                <Field label="Lead source">{leadSourceLabels[lead.leadSource]}</Field>
                <Field label="Interested in">{lead.interestedPropertyType.map(humanize).join(', ')}</Field>
                <Field label="Preferred locations">{lead.preferredLocation.join(', ')}</Field>
                <Field label="Budget">{formatBudget(lead.budget)}</Field>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-section-title">Lifecycle</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <Field label="Assigned agent">{lead.assignee?.name ?? 'Unassigned'}</Field>
                <Field label="Next follow-up">{lead.nextFollowUpAt && formatDateTime(lead.nextFollowUpAt)}</Field>
                {lead.wonAt && <Field label="Won on">{formatDateTime(lead.wonAt)}</Field>}
                {lead.lostAt && <Field label="Lost on">{formatDateTime(lead.lostAt)}</Field>}
                {lead.lostReason && <Field label="Lost reason">{lead.lostReason}</Field>}
                <Field label="Summary notes"><span className="whitespace-pre-wrap">{lead.notes}</span></Field>
              </dl>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-section-title">Activity</CardTitle></CardHeader>
          <CardContent>
            <LeadActivityTimeline leadId={lead._id} canNote={canUpdate} noteRef={noteRef} />
          </CardContent>
        </Card>
      </div>

      <LeadFormDialog open={dialog === 'edit'} onOpenChange={(o) => !o && setDialog(null)} lead={lead} />
      <LeadStatusDialog lead={dialog === 'status' ? lead : null} onOpenChange={(o) => !o && setDialog(null)} />
      <LeadAssignDialog lead={dialog === 'assign' ? lead : null} onOpenChange={(o) => !o && setDialog(null)} />
      <LeadFollowUpDialog lead={dialog === 'followup' ? lead : null} onOpenChange={(o) => !o && setDialog(null)} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Archive this lead?"
        description="The lead is archived, not erased. Its history stays intact and an administrator can restore it."
        confirmLabel="Archive lead"
        destructive
        onConfirm={onDelete}
      />
    </div>
  );
}