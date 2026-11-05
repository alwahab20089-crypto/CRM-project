import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { leadService } from '@/services/lead-service';
import { makeLead, pageMeta, renderWithProviders } from '@/test/utils';
import { LeadsPage } from './leads-page';

vi.mock('@/services/lead-service', () => ({
  leadService: { list: vi.fn(), members: vi.fn().mockResolvedValue([]), create: vi.fn(), remove: vi.fn(), restore: vi.fn() },
}));
vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ can: () => true, activeMembership: { organization: { currency: 'USD' } } }),
}));

const list = vi.mocked(leadService.list);
const render = () => renderWithProviders(<LeadsPage />, { route: '/app/leads', path: '/app/leads' });

beforeEach(() => {
  vi.resetAllMocks();
  list.mockReset();
  vi.mocked(leadService.members).mockResolvedValue([]);
});
describe('LeadsPage', () => {
  it('shows a loading state, then the leads and the total', async () => {
    list.mockReturnValue(new Promise(() => {}));
    const { unmount } = render();
    expect(screen.getByRole('status', { name: 'Loading leads' })).toBeInTheDocument();
    unmount();

    list.mockResolvedValue({ data: [makeLead()], meta: pageMeta() });
    render();
    expect(await screen.findByRole('link', { name: 'Olivia Bennett' })).toBeInTheDocument();
    expect(screen.getByText('1 lead')).toBeInTheDocument();
    expect(screen.getByText('$100K – $200K')).toBeInTheDocument();
  });

  it('shows an empty state and an error state with retry', async () => {
    list.mockResolvedValueOnce({ data: [], meta: pageMeta({ total: 0 }) });
    const first = render();
    expect(await screen.findByText('No leads yet')).toBeInTheDocument();
    first.unmount();

list.mockRejectedValue(new Error('boom'));
    render();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    list.mockResolvedValueOnce({ data: [makeLead()], meta: pageMeta() });
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('link', { name: 'Olivia Bennett' })).toBeInTheDocument();
  });

  it('searches with a debounce and sends the term to the server', async () => {
    list.mockResolvedValue({ data: [makeLead()], meta: pageMeta() });
    render();
    await screen.findByRole('link', { name: 'Olivia Bennett' });
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search leads' }), 'oli');
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'oli', page: 1 }), expect.anything()), { timeout: 2000 });
  });

  it('applies a filter and offers to clear it', async () => {
    list.mockResolvedValue({ data: [makeLead()], meta: pageMeta() });
    render();
    await screen.findByRole('link', { name: 'Olivia Bennett' });
    await userEvent.click(screen.getByRole('combobox', { name: 'Status' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Qualified' }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'QUALIFIED' }), expect.anything()));
    await userEvent.click(await screen.findByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ status: undefined }), expect.anything()));
  });

  it('paginates on the server', async () => {
    list.mockResolvedValue({ data: [makeLead()], meta: pageMeta({ total: 45, totalPages: 3 }) });
    render();
    await screen.findByRole('link', { name: 'Olivia Bennett' });
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(within(nav).getByText('Page 1 of 3')).toBeInTheDocument();
    await userEvent.click(within(nav).getByRole('button', { name: /next/i }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), expect.anything()));
  });

  it('sorts when a column header is clicked', async () => {
    list.mockResolvedValue({ data: [makeLead()], meta: pageMeta() });
    render();
    await screen.findByRole('link', { name: 'Olivia Bennett' });
    await userEvent.click(screen.getByRole('button', { name: /^priority/i }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ sortBy: 'priority', sortOrder: 'asc' }), expect.anything()));
  });
});