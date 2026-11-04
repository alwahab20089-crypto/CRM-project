import type { UseQueryResult } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { humanize } from '@/lib/labels';
import { DataTable, type Column } from './data-table';
import { DatePicker } from './date-picker';
import { ErrorState } from './error-state';
import { PageHeader } from './page-header';
import { SearchInput } from './search-input';

interface ListPageProps<T extends { _id: string; createdAt: string }> {
  title: string;
  description: string;
  actionLabel: string;
  query: UseQueryResult<T[]>;
  columns: Column<T>[];
  searchText: (row: T) => string;
  searchPlaceholder: string;
  filter?: { label: string; options: string[]; getValue: (row: T) => string };
}

export function ListPage<T extends { _id: string; createdAt: string }>({
  title,
  description,
  actionLabel,
  query,
  columns,
  searchText,
  searchPlaceholder,
  filter,
}: ListPageProps<T>) {
  const [search, setSearch] = useState('');
  const [filterValue, setFilterValue] = useState('ALL');
  const [createdFrom, setCreatedFrom] = useState<Date>();

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const start = createdFrom ? new Date(createdFrom) : undefined;
    start?.setHours(0, 0, 0, 0);
    return (query.data ?? []).filter(
      (row) =>
        (!needle || searchText(row).toLowerCase().includes(needle)) &&
        (!filter || filterValue === 'ALL' || filter.getValue(row) === filterValue) &&
        (!start || new Date(row.createdAt) >= start),
    );
  }, [query.data, search, filterValue, createdFrom, filter, searchText]);

  const hasFilters = search !== '' || filterValue !== 'ALL' || createdFrom !== undefined;
  const clear = () => {
    setSearch('');
    setFilterValue('ALL');
    setCreatedFrom(undefined);
  };

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={() => toast.info(`${actionLabel} will be available once the backend CRUD is built (Phase 4).`)}>
            <Plus /> {actionLabel}
          </Button>
        }
      />
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder} label={`Search ${title.toLowerCase()}`} className="md:w-72" />
          {filter && (
            <Select value={filterValue} onValueChange={setFilterValue}>
              <SelectTrigger className="md:w-48" aria-label={filter.label}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All {filter.label.toLowerCase()}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {humanize(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DatePicker value={createdFrom} onChange={setCreatedFrom} label="Created from" placeholder="Created from" className="md:w-48" />
          {hasFilters && (
            <Button variant="ghost" onClick={clear}>
              Clear filters
            </Button>
          )}
        </div>
        {query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : (
          <DataTable
            key={`${search}|${filterValue}|${createdFrom?.getTime() ?? ''}`}
            columns={columns}
            rows={rows}
            getRowId={(row) => row._id}
            isLoading={query.isLoading}
            caption={title}
          />
        )}
      </Card>
    </>
  );
}