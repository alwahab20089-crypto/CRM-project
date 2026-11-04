import { Link } from 'react-router-dom';
import { AsyncCard } from '@/components/common/async-card';
import { DataTable, type Column } from '@/components/common/data-table';
import { StatusBadge } from '@/components/common/status-badge';
import { PersonCell } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import { useLeads } from '@/hooks/use-crm-queries';
import { formatDate, fullName } from '@/lib/format';
import { humanize, leadSourceLabels } from '@/lib/labels';
import type { Lead, WithAssignee } from '@/types';

type Row = WithAssignee<Lead>;

const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', cell: (l) => <PersonCell name={fullName(l)} subtitle={l.email} /> },
  { key: 'phone', header: 'Contact', cell: (l) => <span className="whitespace-nowrap">{l.phone}</span> },
  { key: 'source', header: 'Source', cell: (l) => leadSourceLabels[l.leadSource] },
  { key: 'property', header: 'Interested in', cell: (l) => (l.interestedPropertyType[0] ? humanize(l.interestedPropertyType[0]) : '—') },
  { key: 'agent', header: 'Agent', cell: (l) => l.assignee?.name ?? 'Unassigned' },
  { key: 'status', header: 'Status', cell: (l) => <StatusBadge status={l.status} /> },
  { key: 'date', header: 'Date', cell: (l) => <span className="whitespace-nowrap">{formatDate(l.createdAt)}</span> },
];

export function RecentLeadsTable() {
  const { data, isLoading, isError, refetch } = useLeads();
  const recent = [...(data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  return (
    <AsyncCard
      title="Recent leads"
      description="The latest inquiries across your team"
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      className="lg:col-span-3"
      contentClassName="px-0"
      action={
        <Button asChild variant="outline" size="sm">
          <Link to="/app/leads">View all</Link>
        </Button>
      }
    >
      <DataTable columns={columns} rows={recent} getRowId={(l) => l._id} pageSize={6} caption="Recent leads" />
    </AsyncCard>
  );
}