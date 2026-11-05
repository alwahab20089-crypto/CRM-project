import { model, Schema, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { ORGANIZATION_STATUSES } from '../../constants';

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 60 },
    logo: { type: String, trim: true, maxlength: 500 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 30 },
    address: {
      line1: { type: String, trim: true, maxlength: 200 },
      city: { type: String, trim: true, maxlength: 100 },
      state: { type: String, trim: true, maxlength: 100 },
      country: { type: String, trim: true, maxlength: 100 },
      postalCode: { type: String, trim: true, maxlength: 20 },
    },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timezone: { type: String, default: 'UTC', maxlength: 64 },
    currency: { type: String, default: 'USD', uppercase: true, minlength: 3, maxlength: 3 },
    status: { type: String, enum: ORGANIZATION_STATUSES, default: 'ACTIVE' },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ ownerId: 1 });

export type OrganizationDoc = HydratedDocument<InferSchemaType<typeof organizationSchema>>;
export const Organization = model('Organization', organizationSchema);