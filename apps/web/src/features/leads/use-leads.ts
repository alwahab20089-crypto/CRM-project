import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';
import { leadService } from '@/services/lead-service';
import type { LeadListParams, LeadPayload } from '@/types/leads';

const root = ['api', 'leads'] as const; // distinct from the Phase 2 mock query keys
export const leadKeys = {
  all: root,
  list: (params: LeadListParams) => [...root, 'list', params] as const,
  detail: (id: string) => [...root, 'detail', id] as const,
  activities: (id: string, type: string | undefined, limit: number) => [...root, 'activities', id, type ?? 'all', limit] as const,
  members: ['api', 'members'] as const,
};

// Don't retry client errors (404/403/422): show them immediately.
const retry = (count: number, err: unknown) => !(err instanceof ApiError && err.status < 500) && count < 1;

export function useLeads(params: LeadListParams) {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: ({ signal }) => leadService.list(params, signal),
    placeholderData: keepPreviousData, // keeps the previous page visible while the next loads
    retry,
  });
}

export function useLead(id: string | undefined) {
  return useQuery({ queryKey: leadKeys.detail(id ?? ''), queryFn: () => leadService.get(id as string), enabled: Boolean(id), retry });
}

export function useLeadActivities(id: string, type: string | undefined, limit: number) {
  return useQuery({
    queryKey: leadKeys.activities(id, type, limit),
    queryFn: () => leadService.activities(id, { type, limit }),
    placeholderData: keepPreviousData,
    retry,
  });
}

export function useMembers(enabled = true) {
  return useQuery({ queryKey: leadKeys.members, queryFn: () => leadService.members(), enabled, staleTime: 5 * 60_000, retry });
}

function useInvalidating<TVars, TData>(fn: (vars: TVars) => Promise<TData>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    // Not optimistic on purpose: status, assignment and permissions are decided by the server.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadKeys.all }),
  });
}

export const useCreateLead = () => useInvalidating((payload: LeadPayload) => leadService.create(payload));
export const useUpdateLead = () => useInvalidating((v: { id: string; payload: LeadPayload }) => leadService.update(v.id, v.payload));
export const useDeleteLead = () => useInvalidating((id: string) => leadService.remove(id));
export const useRestoreLead = () => useInvalidating((id: string) => leadService.restore(id));
export const useUpdateLeadStatus = () =>
  useInvalidating((v: { id: string; status: string; reason?: string }) => leadService.updateStatus(v.id, { status: v.status, reason: v.reason }));
export const useAssignLead = () => useInvalidating((v: { id: string; assignedTo: string | null }) => leadService.assign(v.id, v.assignedTo));
export const useAddLeadNote = () => useInvalidating((v: { id: string; body: string }) => leadService.addNote(v.id, v.body));