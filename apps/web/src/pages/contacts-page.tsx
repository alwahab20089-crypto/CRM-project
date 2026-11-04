import type { Column } from '@/components/common/data-table';
import { ListPage } from '@/components/common/list-page';
import { StatusBadge } from '@/components/common/status-badge';
import { PersonCell } from '@/components/common/user-avatar';
import { useContacts } from '@/hooks/use-crm-queries';
import { formatDate, fullName } from '@/lib/format';
import type { Contact, ContactType, WithAssignee } from '@/types';

type Row = WithAssignee<Contact>;

const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', cell: (c) => <PersonCell name={fullName(c)} subtitle={c.email} /> },
  { key: 'phone', header: 'Phone', cell: (c) => <span className="whitespace-nowrap">{c.phone}</span> },
  { key: 'type', header: 'Type', cell: (c) => <StatusBadge status={c.contactType} /> },
  { key: 'agent', header: 'Assigned to', cell: (c) => c.assignee?.name ?? 'Unassigned' },
  { key: 'created', header: 'Added', cell: (c) => <span className="whitespace-nowrap">{formatDate(c.createdAt)}</span> },
];

const types: ContactType[] = ['CLIENT', 'OWNER', 'TENANT', 'LANDLORD', 'PARTNER', 'OTHER'];
const searchText = (c: Row) => `${fullName(c)} ${c.email ?? ''} ${c.phone}`;

export function ContactsPage() {
  return (
    <ListPage
      title="Contacts"
      description="Clients, owners and partners in one place."
      actionLabel="Add contact"
      query={useContacts()}
      columns={columns}
      searchText={searchText}
      searchPlaceholder="Search by name, email or phone"
      filter={{ label: 'Types', options: types, getValue: (c) => c.contactType }}
    />
  );
}