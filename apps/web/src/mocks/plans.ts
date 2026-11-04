import type { Plan, Subscription, SubscriptionOverview } from '@/types';
import { daysAgo, daysFromNow, ORG_ID } from './helpers';

export const plans: Plan[] = [
  { _id: 'plan_starter', name: 'Starter', slug: 'starter', price: 2900, currency: 'USD', billingInterval: 'MONTH', trialDays: 14, limits: { users: 3, leads: 500, properties: 50, storageMb: 1000 } },
  { _id: 'plan_pro', name: 'Professional', slug: 'professional', price: 7900, currency: 'USD', billingInterval: 'MONTH', trialDays: 14, limits: { users: 15, leads: 10000, properties: 1000, storageMb: 10000 } },
  { _id: 'plan_agency', name: 'Agency', slug: 'agency', price: 19900, currency: 'USD', billingInterval: 'MONTH', trialDays: 14, limits: { users: 50, leads: null, properties: null, storageMb: 50000 } },
];

export const subscription: Subscription = {
  _id: 'sub_001',
  organizationId: ORG_ID,
  planId: 'plan_pro',
  status: 'ACTIVE',
  currentPeriodStart: daysAgo(12),
  currentPeriodEnd: daysFromNow(18),
  cancelAtPeriodEnd: false,
};

export const subscriptionOverview: SubscriptionOverview = {
  plan: plans[1]!,
  subscription,
  usage: { users: 4, leads: 1284, properties: 342, storageMb: 3860 },
};