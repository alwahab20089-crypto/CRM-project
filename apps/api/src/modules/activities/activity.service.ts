
import type { ClientSession, Types } from 'mongoose';
import { Activity } from './activity.model';
import { ACTIVITY_ENTITY_TYPES, ACTIVITY_TYPES } from '../../constants';

type Id = string | Types.ObjectId;

type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];
type ActivityType = (typeof ACTIVITY_TYPES)[number];

export async function recordActivity(
  input: {
    organizationId: Id;
    userId: Id;
    entityType: ActivityEntityType;
    entityId: Id;
    activityType: ActivityType;
    description: string;
    metadata?: Record<string, unknown>;
  },
  session?: ClientSession,
) {
  const [activity] = await Activity.create(
    [input],
    session ? { session } : {},
  );

  if (!activity) {
    throw new Error('Failed to create activity');
  }

  return activity;
}
