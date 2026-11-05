import { useState } from 'react';
import { toast } from 'sonner';
import { LoadingButton } from '@/components/common/loading-button';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { errorMessage } from '@/lib/errors';
import type { LeadDto } from '@/types/leads';
import { fromLocalInput, toLocalInput } from './lead-schemas';
import { useUpdateLead } from './use-leads';

function FollowUpForm({ lead, onDone }: { lead: LeadDto; onDone: () => void }) {
  const [value, setValue] = useState(toLocalInput(lead.nextFollowUpAt));
  const mutation = useUpdateLead();
  const invalid = value !== '' && Number.isNaN(new Date(value).getTime());

  const save = async (next: string | null) => {
    if (mutation.isPending) return;
    try {
      await mutation.mutateAsync({ id: lead._id, payload: { nextFollowUpAt: next } });
      toast.success(next ? 'Follow-up scheduled' : 'Follow-up cleared');
      onDone();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save the follow-up'));
    }
  };

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="followup-input">Next follow-up</Label>
        <Input id="followup-input" type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} aria-invalid={invalid || undefined} />
        {invalid && <p role="alert" className="text-xs text-destructive">Enter a valid date and time.</p>}
      </div>
      <DialogFooter className="mt-4">
        {lead.nextFollowUpAt && (
          <Button variant="ghost" onClick={() => save(null)} disabled={mutation.isPending} className="sm:mr-auto">
            Clear
          </Button>
        )}
        <Button variant="outline" onClick={onDone} disabled={mutation.isPending}>
          Cancel
        </Button>
        <LoadingButton onClick={() => save(fromLocalInput(value))} loading={mutation.isPending} disabled={!value || invalid}>
          Save follow-up
        </LoadingButton>
      </DialogFooter>
    </>
  );
}

export function LeadFollowUpDialog({ lead, onOpenChange }: { lead: LeadDto | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={lead !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule follow-up</DialogTitle>
          <DialogDescription>Pick when you next need to contact this lead.</DialogDescription>
        </DialogHeader>
        {lead && <FollowUpForm lead={lead} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}