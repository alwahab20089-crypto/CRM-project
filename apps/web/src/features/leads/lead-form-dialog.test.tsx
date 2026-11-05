import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { leadService } from '@/services/lead-service';
import { makeLead, renderWithProviders } from '@/test/utils';
import { LeadFormDialog } from './lead-form-dialog';

vi.mock('@/services/lead-service', () => ({
  leadService: { create: vi.fn(), update: vi.fn(), members: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ can: () => true, activeMembership: { organization: { currency: 'USD' } } }),
}));

const create = vi.mocked(leadService.create);
const update = vi.mocked(leadService.update);
const open = (lead?: ReturnType<typeof makeLead>) =>
  renderWithProviders(<LeadFormDialog open onOpenChange={() => {}} lead={lead} />);

beforeEach(() => vi.clearAllMocks());

describe('LeadFormDialog', () => {
  
it('validates required fields, email and budget range', async () => {
  const user = userEvent.setup();

  open();

  await user.click(screen.getByRole('button', { name: 'Create lead' }));

  expect(await screen.findByText('First name is required')).toBeInTheDocument();
  expect(screen.getByText('Phone is required')).toBeInTheDocument();

  await user.type(screen.getByLabelText('First name *'), 'Ali');
  await user.type(screen.getByLabelText('Phone *'), '03001234567');
  await user.type(screen.getByLabelText('Email'), 'not-an-email');
  await user.type(screen.getByLabelText('Minimum budget'), '500');
  await user.type(screen.getByLabelText('Maximum budget'), '100');

  await user.click(screen.getByRole('button', { name: 'Create lead' }));

  expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
  expect(screen.getByText('Maximum must be at least the minimum')).toBeInTheDocument();

  expect(create).not.toHaveBeenCalled();
}, 10_000);

  it('creates a lead, converting the budget to minor units', async () => {
    create.mockResolvedValue({ data: makeLead(), meta: { duplicates: [] } });
    open();
    await userEvent.type(screen.getByLabelText('First name *'), 'Ali');
    await userEvent.type(screen.getByLabelText('Phone *'), '+92 300 1234567');
    await userEvent.type(screen.getByLabelText('Minimum budget'), '100');
    await userEvent.type(screen.getByLabelText('Maximum budget'), '200.50');
    await userEvent.click(screen.getByRole('button', { name: 'Create lead' }));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0]![0]).toMatchObject({
      firstName: 'Ali',
      phone: '+92 300 1234567',
      leadType: 'BUYER',
      leadSource: 'WEBSITE',
      status: 'NEW',
      budget: { min: 10_000, max: 20_050, currency: 'USD' },
    });
  });

  it('disables submission while saving so it cannot be submitted twice', async () => {
    create.mockReturnValue(new Promise(() => {}));
    open();
    await userEvent.type(screen.getByLabelText('First name *'), 'Ali');
    await userEvent.type(screen.getByLabelText('Phone *'), '03001234567');
    await userEvent.click(screen.getByRole('button', { name: 'Create lead' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create lead' })).toBeDisabled());
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('edits an existing lead and sends null for cleared fields', async () => {
    update.mockResolvedValue(makeLead({ firstName: 'Olive' }));
    open(makeLead());
    const first = screen.getByLabelText('First name *');
    await userEvent.clear(first);
    await userEvent.type(first, 'Olive');
    await userEvent.clear(screen.getByLabelText('Email'));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0]![0]).toBe('lead1');
    expect(update.mock.calls[0]![1]).toMatchObject({ firstName: 'Olive', email: null, budget: { min: 10_000_000, max: 20_000_000, currency: 'USD' } });
  });
});