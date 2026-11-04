import type { Organization } from '@/types';

export const organizations: Organization[] = [
  {
    _id: 'org_001',
    name: 'Northgate Realty',
    slug: 'northgate-realty',
    email: 'hello@northgate.example',
    phone: '+1 555 0199',
    address: { line1: '120 Pine Street', city: 'Seattle', state: 'WA', country: 'United States', postalCode: '98101' },
    ownerId: 'usr_001',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    status: 'ACTIVE',
  },
  {
    _id: 'org_002',
    name: 'Harbor & Co Properties',
    slug: 'harbor-co',
    email: 'info@harborco.example',
    phone: '+1 555 0150',
    address: { line1: '8 Dockside Avenue', city: 'Tacoma', state: 'WA', country: 'United States', postalCode: '98402' },
    ownerId: 'usr_001',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    status: 'ACTIVE',
  },
];