import { model, Schema, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { MEMBER_ROLES, MEMBER_STATUSES, MEMBERSHIP_INVITATION_STATUSES } from '../../constants';

const memberSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: MEMBER_ROLES, required: true },
    /** Extra permissions granted on top of the role defaults. */
    permissions: { type: [String], default: [] },
    /** Permissions revoked from the role defaults. */
    deniedPermissions: { type: [String], default: [] },
    invitationStatus: { type: String, enum: MEMBERSHIP_INVITATION_STATUSES, default: 'ACCEPTED' },
    status: { type: String, enum: MEMBER_STATUSES, default: 'ACTIVE' },
    joinedAt: { type: Date },
  },
  { timestamps: true },
);

memberSchema.index({ organizationId: 1, userId: 1 }, { unique: true }); // no duplicate memberships
memberSchema.index({ userId: 1 });
memberSchema.index({ organizationId: 1, role: 1 });
// Exactly one OWNER per organization
memberSchema.index(
  { organizationId: 1 },
  { unique: true, partialFilterExpression: { role: 'OWNER' }, name: 'one_owner_per_organization' },
);

export type MemberDoc = HydratedDocument<InferSchemaType<typeof memberSchema>>;
export const OrganizationMember = model('OrganizationMember', memberSchema);