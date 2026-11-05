import { apiRequest, apiRequestPaged } from '@/lib/api-client';
import type {
  DuplicateLead,
  LeadActivityDto,
  LeadDto,
  LeadListParams,
  LeadPayload,
  MemberOption,
  PageMeta,
} from '@/types/leads';

const startOfDay = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 0, 0, 0, 0).toISOString();
};
const endOfDay = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 23, 59, 59, 999).toISOString();
};

export function toQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `?${text}` : '';
}

export const leadService = {
  list: (params: LeadListParams, signal?: AbortSignal) =>
    apiRequestPaged<LeadDto[], PageMeta>(
      `/leads${toQuery({
        ...params,
        createdFrom: params.createdFrom ? startOfDay(params.createdFrom) : undefined,
        createdTo: params.createdTo ? endOfDay(params.createdTo) : undefined,
      })}`,
      { signal },
    ),
  get: (id: string) => apiRequest<LeadDto>(`/leads/${id}`),
  create: (body: LeadPayload) => apiRequestPaged<LeadDto, { duplicates: DuplicateLead[] }>('/leads', { method: 'POST', body }),
  update: (id: string, body: LeadPayload) => apiRequest<LeadDto>(`/leads/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => apiRequest<LeadDto>(`/leads/${id}`, { method: 'DELETE' }),
  restore: (id: string) => apiRequest<LeadDto>(`/leads/${id}/restore`, { method: 'POST' }),
  updateStatus: (id: string, body: { status: string; reason?: string }) =>
    apiRequest<LeadDto>(`/leads/${id}/status`, { method: 'PATCH', body }),
  assign: (id: string, assignedTo: string | null) =>
    apiRequest<LeadDto>(`/leads/${id}/assign`, { method: 'PATCH', body: { assignedTo } }),
  activities: (id: string, params: { type?: string; limit: number }) =>
    apiRequestPaged<LeadActivityDto[], PageMeta>(`/leads/${id}/activities${toQuery({ ...params, page: 1 })}`),
  addNote: (id: string, body: string) => apiRequest<LeadActivityDto>(`/leads/${id}/notes`, { method: 'POST', body: { body } }),
  members: () => apiRequest<MemberOption[]>('/members'),
};