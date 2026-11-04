import { ListPage } from '@/components/common/list-page';
import { StatusBadge } from '@/components/common/status-badge';
import { PersonCell } from '@/components/common/user-avatar';
import type { Column } from '@/components/common/data-table';
import { useLeads } from '@/hooks/use-crm-queries';
import { formatDate, fullName } from '@/lib/format';
import { leadSourceLabels } from '@/lib/labels';
import type { Lead, LeadStatus, WithAssignee } from '@/types';

type Row = WithAssignee<Lead>;

const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', cell: (l) => <PersonCell name={fullName(l)} subtitle={l.email} /> },
  { key: 'phone', header: 'Phone', cell: (l) => <span className="whitespace-nowrap">{l.phone}</span> },
  { key: 'source', header: 'Source', cell: (l) => leadSourceLabels[l.leadSource] },
  { key: 'priority', header: 'Priority', cell: (l) => <StatusBadge status={l.priority} /> },
  { key: 'agent', header: 'Assigned to', cell: (l) => l.assignee?.name ?? 'Unassigned' },
  { key: 'status', header: 'Status', cell: (l) => <StatusBadge status={l.status} /> },
  { key: 'created', header: 'Created', cell: (l) => <span className="whitespace-nowrap">{formatDate(l.createdAt)}</span> },
];

const statuses: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING_SCHEDULED', 'NEGOTIATION', 'WON', 'LOST'];
const searchText = (l: Row) => `${fullName(l)} ${l.email ?? ''} ${l.phone}`;

export function LeadsPage() {
  return (
    <ListPage
      title="Leads"
      description="Track and qualify every inquiry."
      actionLabel="Add lead"
      query={useLeads()}
      columns={columns}
      searchText={searchText}
      searchPlaceholder="Search by name, email or phone"
      filter={{ label: 'Statuses', options: statuses, getValue: (l) => l.status }}
    />
  );
}