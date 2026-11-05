import { model, Schema } from 'mongoose';

const auditLogSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true, maxlength: 100 },
    resource: { type: String, required: true, maxlength: 50 },
    resourceId: { type: Schema.Types.ObjectId, default: null },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }, // append-only: no update/delete code paths exist
);

auditLogSchema.index({ organizationId: 1, createdAt: -1 });
auditLogSchema.index({ organizationId: 1, resource: 1, resourceId: 1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });

export const AuditLog = model('AuditLog', auditLogSchema);