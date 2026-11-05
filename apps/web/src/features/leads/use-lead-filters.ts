import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { LeadListParams, SortField } from '@/types/leads';
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES, LEAD_TYPES, PAGE_SIZES } from './lead-constants';

const pick = <T extends string>(value: string | null, allowed: readonly T[]): T | undefined =>
  value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
const SORTS: SortField[] = ['createdAt', 'name', 'priority', 'status', 'nextFollowUpAt'];
const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Filters, sorting and pagination live in the URL, so reloads, back/forward and shared links keep their state. */
export function useLeadFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<LeadListParams>(() => {
    const page = Math.max(1, Number(params.get('page')) || 1);
    const limit = PAGE_SIZES.includes(Number(params.get('limit'))) ? Number(params.get('limit')) : 20;
    const from = params.get('createdFrom');
    const to = params.get('createdTo');
    const assignedTo = params.get('assignedTo');
    return {
      page,
      limit,
      search: params.get('search')?.trim() || undefined,
      status: pick(params.get('status'), LEAD_STATUSES),
      priority: pick(params.get('priority'), LEAD_PRIORITIES),
      leadType: pick(params.get('leadType'), LEAD_TYPES),
      leadSource: pick(params.get('leadSource'), LEAD_SOURCES),
      assignedTo: assignedTo === 'unassigned' || (assignedTo && /^[a-f\d]{24}$/i.test(assignedTo)) ? assignedTo : undefined,
      createdFrom: from && YMD.test(from) ? from : undefined,
      createdTo: to && YMD.test(to) ? to : undefined,
      sortBy: pick(params.get('sortBy'), SORTS) ?? 'createdAt',
      sortOrder: params.get('sortOrder') === 'asc' ? 'asc' : 'desc',
      view: params.get('view') === 'archived' ? 'archived' : 'active',
    };
  }, [params]);

  const update = useCallback(
    (patch: Partial<Record<keyof LeadListParams, string | number | undefined>>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === '') next.delete(key);
            else next.set(key, String(value));
          }
          if (!('page' in patch)) next.delete('page'); // any filter/sort change returns to page 1
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const clear = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams();
        for (const keep of ['limit', 'view']) if (prev.get(keep)) next.set(keep, prev.get(keep)!);
        return next;
      },
      { replace: true },
    );
  }, [setParams]);

  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.priority || filters.leadType || filters.leadSource ||
      filters.assignedTo || filters.createdFrom || filters.createdTo,
  );

  return { filters, update, clear, hasActiveFilters };
}