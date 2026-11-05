import { model, Schema } from 'mongoose';
import { INVITATION_STATUSES, MEMBER_ROLES } from '../../constants';

const invitationSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    role: { type: String, enum: MEMBER_ROLES.filter((r) => r !== 'OWNER'), required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true },
    status: { type: String, enum: INVITATION_STATUSES, default: 'PENDING' },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date },
    revokedAt: { type: Date },
  },
  { timestamps: true },
);

invitationSchema.index({ tokenHash: 1 }, { unique: true });
invitationSchema.index({ organizationId: 1, email: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 }); // purge 30 days after expiry

export const Invitation = model('Invitation', invitationSchema);