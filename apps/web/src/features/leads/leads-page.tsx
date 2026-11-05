import { Download, Plus, Target } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { errorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import type { LeadDto, SortField } from '@/types/leads';
import { LeadAssignDialog } from './lead-assign-dialog';
import { LeadFiltersBar } from './lead-filters-bar';
import { LeadFormDialog } from './lead-form-dialog';
import { LeadStatusDialog } from './lead-status-dialog';
import { LeadsTable, type LeadRowAction } from './leads-table';
import { PAGE_SIZES } from './lead-constants';
import { useDeleteLead, useLeads, useRestoreLead } from './use-leads';
import { useLeadFilters } from './use-lead-filters';

export function LeadsPage() {
  const { can } = useAuth();
  const { filters, update, clear, hasActiveFilters } = useLeadFilters();
  const query = useLeads(filters);
  const del = useDeleteLead();
  const restore = useRestoreLead();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LeadDto | null>(null);
  const [statusLead, setStatusLead] = useState<LeadDto | null>(null);
  const [assignLead, setAssignLead] = useState<LeadDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadDto | null>(null);

  const leads = query.data?.data ?? [];
  const meta = query.data?.meta;
  const canDelete = can('leads:delete');
  const archivedView = filters.view === 'archived';

  const onSort = (field: SortField) =>
    update({
      sortBy: field,
      sortOrder: filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : field === 'createdAt' ? 'desc' : 'asc',
    });

  const onAction = async (action: LeadRowAction, lead: LeadDto) => {
    if (action === 'edit') {
      setEditing(lead);
      setFormOpen(true);
    } else if (action === 'status') setStatusLead(lead);
    else if (action === 'assign') setAssignLead(lead);
    else if (action === 'delete') setDeleteTarget(lead);
    else {
      try {
        await restore.mutateAsync(lead._id);
        toast.success('Lead restored');
      } catch (err) {
        toast.error(errorMessage(err, 'Could not restore the lead'));
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync(deleteTarget._id);
      toast.success('Lead archived');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete the lead'));
    } finally {
      setDeleteTarget(null);
    }
  };

  const showError = query.isError && !query.data;
  const showEmpty = !query.isLoading && !showError && leads.length === 0;

  return (
    <>
      <PageHeader
        title={archivedView ? 'Archived leads' : 'Leads'}
        description={query.isLoading ? 'Loading leads…' : `${meta?.total ?? 0} ${meta?.total === 1 ? 'lead' : 'leads'}`}
        actions={
          <>
            {canDelete && (
              <div className="mr-2 flex items-center gap-2">
                <Switch id="show-archived" checked={archivedView} onCheckedChange={(on) => update({ view: on ? 'archived' : undefined })} />
                <Label htmlFor="show-archived" className="font-normal">
                  Show archived
                </Label>
              </div>
            )}
            <Button variant="outline" onClick={() => toast.info('Export is planned for a later phase.')}>
              <Download /> Export
            </Button>
            {can('leads:create') && (
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus /> Add lead
              </Button>
            )}
          </>
        }
      />

      <Card className="gap-0 py-0">
        <LeadFiltersBar filters={filters} hasActiveFilters={hasActiveFilters} onChange={update} onClear={clear} />

        {showError ? (
          <ErrorState message={errorMessage(query.error, 'We could not load your leads.')} onRetry={() => query.refetch()} />
        ) : showEmpty ? (
          hasActiveFilters ? (
            <EmptyState
              icon={Target}
              title="No leads match your filters"
              description="Try a different search or clear the filters."
              action={<Button variant="outline" onClick={clear}>Clear filters</Button>}
            />
          ) : (
            <EmptyState
              icon={Target}
              title={archivedView ? 'No archived leads' : 'No leads yet'}
              description={archivedView ? 'Deleted leads appear here and can be restored.' : 'Add your first lead to start tracking your pipeline.'}
              action={!archivedView && can('leads:create') ? <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus /> Add lead</Button> : undefined}
            />
          )
        ) : (
          <div role={query.isLoading ? 'status' : undefined} aria-label={query.isLoading ? 'Loading leads' : undefined} aria-busy={query.isFetching} className={cn(query.isPlaceholderData && 'opacity-60 transition-opacity')}>
            <LeadsTable
              leads={leads}
              isLoading={query.isLoading}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              onSort={onSort}
              canUpdate={can('leads:update')}
              canAssign={can('leads:assign')}
              canDelete={canDelete}
              onAction={onAction}
            />
          </div>
        )}

        {meta && meta.total > 0 && (
          <Pagination
            page={meta.page}
            pageCount={meta.totalPages}
            total={meta.total}
            pageSize={meta.limit}
            onPageChange={(page) => update({ page })}
            pageSizeOptions={PAGE_SIZES}
            onPageSizeChange={(limit) => update({ limit })}
          />
        )}
      </Card>

      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} lead={editing} />
      <LeadStatusDialog lead={statusLead} onOpenChange={(open) => !open && setStatusLead(null)} />
      <LeadAssignDialog lead={assignLead} onOpenChange={(open) => !open && setAssignLead(null)} />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this lead?"
        description="The lead is archived, not erased. Its history stays intact and an administrator can restore it."
        confirmLabel="Delete lead"
        destructive
        onConfirm={confirmDelete}
      />
    </>
  );
}