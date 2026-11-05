import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api-client';
import { leadService } from '@/services/lead-service';
import { makeLead, pageMeta, renderWithProviders } from '@/test/utils';
import { LeadDetailPage } from './lead-detail-page';

vi.mock('@/services/lead-service', () => ({
  leadService: {
    get: vi.fn(), remove: vi.fn(), updateStatus: vi.fn(), activities: vi.fn(), members: vi.fn().mockResolvedValue([]),
    update: vi.fn(), addNote: vi.fn(), assign: vi.fn(), restore: vi.fn(),
  },
}));
vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ can: () => true, activeMembership: { organization: { currency: 'USD' } } }),
}));

const svc = vi.mocked(leadService);
const render = () => renderWithProviders(<LeadDetailPage />, { route: '/app/leads/lead1', path: '/app/leads/:leadId' });

beforeEach(() => {
  vi.clearAllMocks();
  svc.get.mockResolvedValue(makeLead());
  svc.activities.mockResolvedValue({
    data: [{ _id: 'a1', activityType: 'CREATED', description: 'Lead created', user: { _id: 'u1', name: 'Alex' }, createdAt: '2026-11-01T10:00:00.000Z' }],
    meta: pageMeta(),
  });
});

describe('LeadDetailPage', () => {
  it('renders the lead and its activity timeline', async () => {
    render();
    expect(await screen.findByRole('heading', { name: 'Olivia Bennett' })).toBeInTheDocument();
    expect(await screen.findByText('Lead created')).toBeInTheDocument();
  });

  it('shows a not-found state', async () => {
    svc.get.mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Lead not found'));
    render();
    expect(await screen.findByText('Lead not found')).toBeInTheDocument();
  });

  it('asks for confirmation before deleting and cancels cleanly', async () => {
    svc.remove.mockResolvedValue(makeLead());
    render();
    await userEvent.click(await screen.findByRole('button', { name: /archive lead/i }));
    const dialog = await screen.findByRole('alertdialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(svc.remove).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /archive lead/i }));
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Archive lead' }));
    await waitFor(() => expect(svc.remove).toHaveBeenCalledWith('lead1'));
  });

  it('changes the status', async () => {
    svc.updateStatus.mockResolvedValue(makeLead({ status: 'CONTACTED' }));
    render();
    await userEvent.click(await screen.findByRole('button', { name: /change status/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'Contacted' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Update status' }));
    await waitFor(() => expect(svc.updateStatus).toHaveBeenCalledWith('lead1', { status: 'CONTACTED', reason: undefined }));
  });

  it('requires a reason before marking a lead as lost', async () => {
    render();
    await userEvent.click(await screen.findByRole('button', { name: /change status/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'Lost' }));
    expect(within(dialog).getByRole('button', { name: 'Update status' })).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText('Reason *'), 'Bought elsewhere');
    expect(within(dialog).getByRole('button', { name: 'Update status' })).toBeEnabled();
  });
});