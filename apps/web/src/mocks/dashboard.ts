import type { DashboardData } from '@/types';

export const dashboardData: DashboardData = {
  kpis: [
    { key: 'totalLeads', label: 'Total leads', value: 1284, previousValue: 1141, changePct: 12.5, helper: '143 new this month', positiveIsGood: true },
    { key: 'activeProperties', label: 'Active properties', value: 342, previousValue: 328, changePct: 4.3, helper: '14 listed this month', positiveIsGood: true },
    { key: 'convertedCustomers', label: 'Converted customers', value: 96, previousValue: 89, changePct: 7.9, helper: '7.5% conversion rate', positiveIsGood: true },
    { key: 'pendingFollowUps', label: 'Pending follow-ups', value: 37, previousValue: 39, changePct: -5.1, helper: '9 due today', positiveIsGood: false },
  ],
  leadsOverTime: {
    monthly: [
      ['Dec', 72], ['Jan', 81], ['Feb', 77], ['Mar', 94], ['Apr', 103], ['May', 98],
      ['Jun', 112], ['Jul', 121], ['Aug', 118], ['Sep', 134], ['Oct', 139], ['Nov', 143],
    ].map(([label, value]) => ({ label: label as string, value: value as number })),
    weekly: [
      ['W1', 28], ['W2', 31], ['W3', 26], ['W4', 35], ['W5', 33], ['W6', 38], ['W7', 36], ['W8', 41],
    ].map(([label, value]) => ({ label: label as string, value: value as number })),
  },
  leadSources: [
    { source: 'WEBSITE', count: 412 },
    { source: 'FACEBOOK', count: 286 },
    { source: 'INSTAGRAM', count: 198 },
    { source: 'REFERRAL', count: 164 },
    { source: 'WALK_IN', count: 121 },
    { source: 'OTHER', count: 103 },
  ],
  pipeline: [
    { status: 'NEW', count: 214 },
    { status: 'CONTACTED', count: 168 },
    { status: 'QUALIFIED', count: 121 },
    { status: 'NEGOTIATION', count: 64 },
    { status: 'WON', count: 96 },
    { status: 'LOST', count: 58 },
  ],
};