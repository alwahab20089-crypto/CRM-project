import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { LeadDto } from '@/types/leads';

export function renderWithProviders(ui: ReactElement, options: { route?: string; path?: string } = {}) {
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      retryDelay: 0,
      gcTime: 0,
    },
    mutations: { retry: false },
  },
});
  const { route = '/', path = '/' } = options;
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={ui} />
            <Route path="*" element={<div>elsewhere</div>} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

export const makeLead = (over: Partial<LeadDto> = {}): LeadDto => ({
  _id: 'lead1', firstName: 'Olivia', lastName: 'Bennett', email: 'olivia@example.com', phone: '+15550100100',
  alternatePhone: null, leadSource: 'WEBSITE', leadType: 'BUYER', status: 'NEW', priority: 'HIGH',
  budget: { min: 10_000_000, max: 20_000_000, currency: 'USD' }, preferredLocation: ['DHA'], interestedPropertyType: ['APARTMENT'],
  notes: null, nextFollowUpAt: null, assignedTo: null, assignee: null, wonAt: null, lostAt: null, lostReason: null,
  createdBy: 'u1', deletedAt: null, createdAt: '2026-11-01T10:00:00.000Z', updatedAt: '2026-11-01T10:00:00.000Z', ...over,
});

export const pageMeta = (over = {}) => ({ page: 1, limit: 20, total: 1, totalPages: 1, ...over });