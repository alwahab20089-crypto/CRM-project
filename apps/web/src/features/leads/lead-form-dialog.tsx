import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormField, fieldA11y } from '@/components/common/form-field';
import { LoadingButton } from '@/components/common/loading-button';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api-client';
import { errorMessage } from '@/lib/errors';
import { humanize, leadSourceLabels } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import type { LeadDto } from '@/types/leads';
import {
  CURRENCIES, LEAD_PRIORITIES, LEAD_SOURCES, LEAD_TYPES, OPEN_STATUSES, PROPERTY_TYPES,
} from './lead-constants';
import {
  defaultLeadValues, leadFormSchema, leadToFormValues, SERVER_FIELD_MAP, toLeadPayload, type LeadFormValues,
} from './lead-schemas';
import { useCreateLead, useMembers, useUpdateLead } from './use-leads';

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: LeadDto | null; // present = edit mode
}

const UNASSIGNED = 'unassigned';

export function LeadFormDialog({ open, onOpenChange, lead }: LeadFormDialogProps) {
  const isEdit = Boolean(lead);
  const { can, activeMembership } = useAuth();
  const orgCurrency = activeMembership?.organization.currency ?? 'USD';
  const canAssign = can('leads:assign') && !isEdit; // assignment after creation has its own audited action
  const members = useMembers(open && canAssign);
  const create = useCreateLead();
  const update = useUpdateLead();
  const saving = create.isPending || update.isPending;

  const {
    register, control, handleSubmit, reset, setError,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: lead ? leadToFormValues(lead, orgCurrency) : defaultLeadValues(orgCurrency),
  });

  useEffect(() => {
    if (open) reset(lead ? leadToFormValues(lead, orgCurrency) : defaultLeadValues(orgCurrency));
  }, [open, lead, orgCurrency, reset]);

  const onSubmit = async (values: LeadFormValues) => {
    if (saving) return; // prevents duplicate submissions
    try {
      if (lead) {
        await update.mutateAsync({ id: lead._id, payload: toLeadPayload(values, true) });
        toast.success('Lead updated');
      } else {
        const payload = { ...toLeadPayload(values, false), status: values.status, assignedTo: values.assignedTo || undefined };
        const { meta } = await create.mutateAsync(payload);
        toast.success('Lead created');
        if (meta.duplicates?.length) {
          toast.warning('Possible duplicate lead', {
            description: `Same phone or email as ${meta.duplicates.map((d) => d.name).join(', ')}.`,
          });
        }
      }
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        for (const detail of err.errors) {
          const field = detail.path ? SERVER_FIELD_MAP[detail.path] : undefined;
          if (field) setError(field, { message: detail.message });
        }
      }
      toast.error(errorMessage(err, 'Could not save the lead'));
    }
  };

  const select = <K extends 'leadType' | 'leadSource' | 'priority' | 'status' | 'currency'>(
    name: K, id: string, options: Array<{ value: string; label: string }>,
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit lead' : 'Add lead'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'Update contact details and requirements.' : 'Capture a new inquiry. Only name and phone are required.'}
            </DialogDescription>
          </DialogHeader>

          <fieldset className="space-y-4">
            <legend className="text-label mb-2">Contact</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="lead-first" label="First name *" error={errors.firstName?.message}>
                <Input autoComplete="off" {...fieldA11y('lead-first', errors.firstName?.message)} {...register('firstName')} />
              </FormField>
              <FormField id="lead-last" label="Last name" error={errors.lastName?.message}>
                <Input autoComplete="off" {...fieldA11y('lead-last', errors.lastName?.message)} {...register('lastName')} />
              </FormField>
              <FormField id="lead-phone" label="Phone *" hint="International format welcome, e.g. +92 300 1234567" error={errors.phone?.message}>
                <Input type="tel" {...fieldA11y('lead-phone', errors.phone?.message)} {...register('phone')} />
              </FormField>
              <FormField id="lead-alt" label="Alternate phone" error={errors.alternatePhone?.message}>
                <Input type="tel" {...fieldA11y('lead-alt', errors.alternatePhone?.message)} {...register('alternatePhone')} />
              </FormField>
              <FormField id="lead-email" label="Email" error={errors.email?.message} className="sm:col-span-2">
                <Input type="email" {...fieldA11y('lead-email', errors.email?.message)} {...register('email')} />
              </FormField>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-label mb-2">Lead details</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="lead-type" label="Lead type">
                {select('leadType', 'lead-type', LEAD_TYPES.map((v) => ({ value: v, label: humanize(v) })))}
              </FormField>
              <FormField id="lead-source" label="Lead source">
                {select('leadSource', 'lead-source', LEAD_SOURCES.map((v) => ({ value: v, label: leadSourceLabels[v] })))}
              </FormField>
              <FormField id="lead-priority" label="Priority">
                {select('priority', 'lead-priority', LEAD_PRIORITIES.map((v) => ({ value: v, label: humanize(v) })))}
              </FormField>
              {!isEdit && (
                <FormField id="lead-status" label="Status">
                  {select('status', 'lead-status', OPEN_STATUSES.map((v) => ({ value: v, label: humanize(v) })))}
                </FormField>
              )}
              {canAssign && (
                <FormField id="lead-assignee" label="Assigned agent" className="sm:col-span-2">
                  <Controller
                    control={control}
                    name="assignedTo"
                    render={({ field }) => (
                      <Select value={field.value || UNASSIGNED} onValueChange={(v) => field.onChange(v === UNASSIGNED ? '' : v)}>
                        <SelectTrigger id="lead-assignee" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                          {(members.data ?? []).map((m) => (
                            <SelectItem key={m.userId} value={m.userId}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              )}
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-label mb-2">Requirements</legend>
            <div role="group" aria-label="Interested property types" className="flex flex-wrap gap-2">
              <Controller
                control={control}
                name="interestedPropertyType"
                render={({ field }) => (
                  <>
                    {PROPERTY_TYPES.map((type) => {
                      const selected = field.value.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => field.onChange(selected ? field.value.filter((t) => t !== type) : [...field.value, type])}
                          className={cn(
                            'rounded-full border px-3 py-1 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            selected ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent',
                          )}
                        >
                          {humanize(type)}
                        </button>
                      );
                    })}
                  </>
                )}
              />
            </div>
            <FormField id="lead-locations" label="Preferred locations" hint="Separate with commas" error={errors.preferredLocation?.message}>
              <Input placeholder="DHA Phase 5, Gulberg" {...fieldA11y('lead-locations', errors.preferredLocation?.message)} {...register('preferredLocation')} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField id="lead-bmin" label="Minimum budget" error={errors.budgetMin?.message}>
                <Input inputMode="decimal" placeholder="0" {...fieldA11y('lead-bmin', errors.budgetMin?.message)} {...register('budgetMin')} />
              </FormField>
              <FormField id="lead-bmax" label="Maximum budget" error={errors.budgetMax?.message}>
                <Input inputMode="decimal" placeholder="0" {...fieldA11y('lead-bmax', errors.budgetMax?.message)} {...register('budgetMax')} />
              </FormField>
              <FormField id="lead-currency" label="Currency">
                {select('currency', 'lead-currency', CURRENCIES.map((c) => ({ value: c, label: c })))}
              </FormField>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-label mb-2">Follow-up</legend>
            <FormField id="lead-followup" label="Next follow-up" error={errors.nextFollowUpAt?.message}>
              <Input type="datetime-local" {...fieldA11y('lead-followup', errors.nextFollowUpAt?.message)} {...register('nextFollowUpAt')} />
            </FormField>
            <FormField id="lead-notes" label="Notes" error={errors.notes?.message}>
              <Textarea rows={3} {...fieldA11y('lead-notes', errors.notes?.message)} {...register('notes')} />
            </FormField>
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <LoadingButton type="submit" loading={saving}>
              {isEdit ? 'Save changes' : 'Create lead'}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}