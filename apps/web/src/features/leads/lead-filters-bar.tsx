import { useEffect, useState } from 'react';
import { DatePicker } from '@/components/common/date-picker';
import { SearchInput } from '@/components/common/search-input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { humanize, leadSourceLabels } from '@/lib/labels';
import { useAuth } from '@/providers/auth-provider';
import type { LeadListParams } from '@/types/leads';
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES, LEAD_TYPES } from './lead-constants';
import { useMembers } from './use-leads';

const toYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromYmd = (s?: string) => {
  if (!s) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
};

interface FilterSelectProps {
  label: string;
  allLabel: string;
  value: string | undefined;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string | undefined) => void;
}

function FilterSelect({ label, allLabel, value, options, onChange }: FilterSelectProps) {
  return (
    <Select value={value ?? 'ALL'} onValueChange={(v) => onChange(v === 'ALL' ? undefined : v)}>
      <SelectTrigger aria-label={label} className="w-full lg:w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface LeadFiltersBarProps {
  filters: LeadListParams;
  hasActiveFilters: boolean;
  onChange: (patch: Partial<Record<keyof LeadListParams, string | undefined>>) => void;
  onClear: () => void;
}

export function LeadFiltersBar({ filters, hasActiveFilters, onChange, onClear }: LeadFiltersBarProps) {
  const { can } = useAuth();
  const seeAll = can('leads:read_all');
  const members = useMembers(seeAll && can('members:read'));
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const debounced = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    if (debounced.trim() !== (filters.search ?? '')) onChange({ search: debounced.trim() || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const assigneeOptions = [
    { value: 'unassigned', label: 'Unassigned' },
    ...(members.data ?? []).map((m) => ({ value: m.userId, label: m.name })),
  ];

  return (
    <div className="space-y-3 border-b p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search name, email or phone" label="Search leads" className="sm:col-span-2 lg:w-72" />
        <FilterSelect label="Status" allLabel="All statuses" value={filters.status} onChange={(v) => onChange({ status: v })} options={LEAD_STATUSES.map((s) => ({ value: s, label: humanize(s) }))} />
        <FilterSelect label="Lead type" allLabel="All types" value={filters.leadType} onChange={(v) => onChange({ leadType: v })} options={LEAD_TYPES.map((s) => ({ value: s, label: humanize(s) }))} />
        <FilterSelect label="Lead source" allLabel="All sources" value={filters.leadSource} onChange={(v) => onChange({ leadSource: v })} options={LEAD_SOURCES.map((s) => ({ value: s, label: leadSourceLabels[s] }))} />
        <FilterSelect label="Priority" allLabel="All priorities" value={filters.priority} onChange={(v) => onChange({ priority: v })} options={LEAD_PRIORITIES.map((s) => ({ value: s, label: humanize(s) }))} />
        {seeAll && can('members:read') && (
          <FilterSelect label="Assigned agent" allLabel="All agents" value={filters.assignedTo} onChange={(v) => onChange({ assignedTo: v })} options={assigneeOptions} />
        )}
        <DatePicker label="Created from" placeholder="Created from" value={fromYmd(filters.createdFrom)} onChange={(d) => onChange({ createdFrom: d ? toYmd(d) : undefined })} className="w-full lg:w-40" />
        <DatePicker label="Created to" placeholder="Created to" value={fromYmd(filters.createdTo)} onChange={(d) => onChange({ createdTo: d ? toYmd(d) : undefined })} className="w-full lg:w-40" />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchInput('');
              onClear();
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}