import type { Column } from '@/components/common/data-table';
import { ListPage } from '@/components/common/list-page';
import { StatusBadge } from '@/components/common/status-badge';
import { useProperties } from '@/hooks/use-crm-queries';
import { formatCurrency } from '@/lib/format';
import { humanize } from '@/lib/labels';
import type { ListingStatus, Property, WithAssignee } from '@/types';

type Row = WithAssignee<Property>;

const columns: Column<Row>[] = [
  {
    key: 'title',
    header: 'Property',
    cell: (p) => (
      <div>
        <p className="font-medium">{p.title}</p>
        <p className="text-xs text-muted-foreground">
          {p.area}, {p.city}
        </p>
      </div>
    ),
  },
  { key: 'type', header: 'Type', cell: (p) => humanize(p.propertyType) },
  { key: 'listing', header: 'Listing', cell: (p) => humanize(p.listingType) },
  {
    key: 'price',
    header: 'Price',
    cell: (p) => (
      <span className="whitespace-nowrap tabular-nums">
        {formatCurrency(p.price, p.currency)}
        {p.listingType === 'RENT' ? '/mo' : ''}
      </span>
    ),
  },
  { key: 'beds', header: 'Beds / baths', cell: (p) => (p.bedrooms !== undefined ? `${p.bedrooms} / ${p.bathrooms ?? '—'}` : '—') },
  { key: 'agent', header: 'Agent', cell: (p) => p.assignee?.name ?? 'Unassigned' },
  { key: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.listingStatus} /> },
];

const statuses: ListingStatus[] = ['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'INACTIVE'];

export function PropertiesPage() {
  return (
    <ListPage
      title="Properties"
      description="Your listings, from available to sold."
      actionLabel="Add property"
      query={useProperties()}
      columns={columns}
      searchText={(p: Row) => `${p.title} ${p.city} ${p.area}`}
      searchPlaceholder="Search by title, city or area"
      filter={{ label: 'Statuses', options: statuses, getValue: (p) => p.listingStatus }}
    />
  );
}