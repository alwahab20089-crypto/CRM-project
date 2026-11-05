import { useState } from 'react';
import { toast } from 'sonner';
import { LoadingButton } from '@/components/common/loading-button';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { errorMessage } from '@/lib/errors';
import { humanize } from '@/lib/labels';
import { useAuth } from '@/providers/auth-provider';
import type { LeadStatus } from '@/types';
import type { LeadDto } from '@/types/leads';
import { allowedTargets } from './lead-constants';
import { useUpdateLeadStatus } from './use-leads';

function StatusForm({ lead, onDone }: { lead: LeadDto; onDone: () => void }) {
  const { can } = useAuth();
  const targets = allowedTargets(lead.status, can('leads:reopen'));
  const [status, setStatus] = useState<LeadStatus | ''>(targets[0] ?? '');
  const [reason, setReason] = useState('');
  const mutation = useUpdateLeadStatus();

  const reopening = lead.status === 'WON' || lead.status === 'LOST';
  const reasonRequired = status === 'LOST' || reopening;
  const reasonTooShort = reasonRequired && reason.trim().length < 3;

  const submit = async () => {
    if (!status || mutation.isPending) return;
    try {
      await mutation.mutateAsync({ id: lead._id, status, reason: reason.trim() || undefined });
      toast.success(`Status changed to ${humanize(status)}`);
      onDone();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not change the status'));
    }
  };

  if (targets.length === 0) {
    return <p className="text-sm text-muted-foreground">Only managers and above can reopen a {humanize(lead.status).toLowerCase()} lead.</p>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="status-select">New status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
            <SelectTrigger id="status-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {targets.map((s) => (
                <SelectItem key={s} value={s}>
                  {humanize(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(reasonRequired || status !== '') && (
          <div className="space-y-1.5">
            <Label htmlFor="status-reason">{reasonRequired ? 'Reason *' : 'Comment (optional)'}</Label>
            <Textarea id="status-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
            {reasonRequired && reasonTooShort && <p className="text-caption">A short reason is required for this change.</p>}
          </div>
        )}
      </div>
      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onDone} disabled={mutation.isPending}>
          Cancel
        </Button>
        <LoadingButton onClick={submit} loading={mutation.isPending} disabled={!status || reasonTooShort}>
          Update status
        </LoadingButton>
      </DialogFooter>
    </>
  );
}

export function LeadStatusDialog({ lead, onOpenChange }: { lead: LeadDto | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={lead !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change status</DialogTitle>
          <DialogDescription>
            {lead ? `${lead.firstName} ${lead.lastName} is currently ${humanize(lead.status)}.` : ''}
          </DialogDescription>
        </DialogHeader>
        {lead && <StatusForm lead={lead} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}