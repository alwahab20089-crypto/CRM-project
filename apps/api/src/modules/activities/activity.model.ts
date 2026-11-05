import { model, Schema } from 'mongoose';
import { ACTIVITY_ENTITY_TYPES, ACTIVITY_TYPES } from '../../constants';

const activitySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    entityType: { type: String, enum: ACTIVITY_ENTITY_TYPES, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    activityType: { type: String, enum: ACTIVITY_TYPES, required: true },
    description: { type: String, required: true, maxlength: 2000 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }, // append-only: no update/delete code paths exist
);

activitySchema.index({ organizationId: 1, entityType: 1, entityId: 1, createdAt: -1 });
activitySchema.index({ organizationId: 1, userId: 1, createdAt: -1 });

export const Activity = model('Activity', activitySchema);