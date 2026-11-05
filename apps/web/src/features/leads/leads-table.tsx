import { ArrowDown, ArrowUp, ArrowUpDown, Ellipsis } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/common/status-badge';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, formatDateTime } from '@/lib/format';
import { humanize, leadSourceLabels } from '@/lib/labels';
import { formatBudget } from '@/lib/money';
import type { LeadDto, LeadListParams, SortField } from '@/types/leads';

export type LeadRowAction = 'edit' | 'status' | 'assign' | 'delete' | 'restore';

interface LeadsTableProps {
  leads: LeadDto[];
  isLoading: boolean;
  sortBy: LeadListParams['sortBy'];
  sortOrder: LeadListParams['sortOrder'];
  onSort: (field: SortField) => void;
  canUpdate: boolean;
  canAssign: boolean;
  canDelete: boolean;
  onAction: (action: LeadRowAction, lead: LeadDto) => void;
}

function SortHead({ label, field, ...props }: { label: string; field: SortField } & Pick<LeadsTableProps, 'sortBy' | 'sortOrder' | 'onSort'>) {
  const active = props.sortBy === field;
  const Icon = !active ? ArrowUpDown : props.sortOrder === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead aria-sort={active ? (props.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => props.onSort(field)}
        className="-mx-1 inline-flex items-center gap-1 rounded px-1 font-medium outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        {label}
        <Icon className="size-3.5" aria-hidden />
      </button>
    </TableHead>
  );
}

export function LeadsTable({ leads, isLoading, sortBy, sortOrder, onSort, canUpdate, canAssign, canDelete, onAction }: LeadsTableProps) {
  const sort = { sortBy, sortOrder, onSort };
  return (
    <Table>
      <caption className="sr-only">Leads</caption>
      <TableHeader>
        <TableRow>
          <SortHead label="Lead" field="name" {...sort} />
          <TableHead>Type</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Interested in</TableHead>
          <TableHead>Budget</TableHead>
          <TableHead>Assigned to</TableHead>
          <SortHead label="Priority" field="priority" {...sort} />
          <SortHead label="Status" field="status" {...sort} />
          <SortHead label="Follow-up" field="nextFollowUpAt" {...sort} />
          <SortHead label="Created" field="createdAt" {...sort} />
          <TableHead className="w-12 text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 11 }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-5 w-full max-w-28" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : leads.map((lead) => {
              const name = `${lead.firstName} ${lead.lastName}`.trim();
              const archived = lead.deletedAt !== null;
              return (
                <TableRow key={lead._id}>
                  <TableCell className="min-w-56">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={name} className="size-8" />
                      <div className="min-w-0">
                        <Link to={`/app/leads/${lead._id}`} className="block truncate font-medium hover:underline focus-visible:underline">
                          {name}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">{lead.email ?? lead.phone}</p>
                        {lead.email && <p className="truncate text-xs text-muted-foreground">{lead.phone}</p>}
                      </div>
                      {archived && <Badge variant="secondary">Archived</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{humanize(lead.leadType)}</TableCell>
                  <TableCell>{leadSourceLabels[lead.leadSource]}</TableCell>
                  <TableCell>{lead.interestedPropertyType.length ? lead.interestedPropertyType.map(humanize).join(', ') : '—'}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{formatBudget(lead.budget, true)}</TableCell>
                  <TableCell>
                    {lead.assignee ? (
                      <span className="flex items-center gap-2">
                        <UserAvatar name={lead.assignee.name} className="size-6" />
                        <span className="truncate">{lead.assignee.name}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell><StatusBadge status={lead.priority} /></TableCell>
                  <TableCell><StatusBadge status={lead.status} /></TableCell>
                  <TableCell className="whitespace-nowrap">{lead.nextFollowUpAt ? formatDateTime(lead.nextFollowUpAt) : '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(lead.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${name}`}>
                          <Ellipsis className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/app/leads/${lead._id}`}>View details</Link>
                        </DropdownMenuItem>
                        {!archived && canUpdate && <DropdownMenuItem onSelect={() => onAction('edit', lead)}>Edit</DropdownMenuItem>}
                        {!archived && canUpdate && <DropdownMenuItem onSelect={() => onAction('status', lead)}>Change status</DropdownMenuItem>}
                        {!archived && canAssign && <DropdownMenuItem onSelect={() => onAction('assign', lead)}>Assign</DropdownMenuItem>}
                        {canDelete && <DropdownMenuSeparator />}
                        {canDelete && !archived && (
                          <DropdownMenuItem variant="destructive" onSelect={() => onAction('delete', lead)}>
                            Delete
                          </DropdownMenuItem>
                        )}
                        {canDelete && archived && <DropdownMenuItem onSelect={() => onAction('restore', lead)}>Restore</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
      </TableBody>
    </Table>
  );
}