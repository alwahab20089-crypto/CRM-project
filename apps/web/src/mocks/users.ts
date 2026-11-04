import type { User } from '@/types';

export const CURRENT_USER_ID = 'usr_001';

export const users: User[] = [
  { _id: 'usr_001', name: 'Alex Morgan', email: 'alex.morgan@example.com', phone: '+1 555 0100', status: 'ACTIVE', emailVerified: true, platformRole: 'NONE' },
  { _id: 'usr_002', name: 'Sara Khan', email: 'sara.khan@example.com', phone: '+1 555 0102', status: 'ACTIVE', emailVerified: true, platformRole: 'NONE' },
  { _id: 'usr_003', name: 'Daniel Lee', email: 'daniel.lee@example.com', phone: '+1 555 0103', status: 'ACTIVE', emailVerified: true, platformRole: 'NONE' },
  { _id: 'usr_004', name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+1 555 0104', status: 'ACTIVE', emailVerified: true, platformRole: 'NONE' },
];

export const userById = new Map(users.map((u) => [u._id, u]));