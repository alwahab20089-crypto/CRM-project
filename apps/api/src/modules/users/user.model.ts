import { model, Schema, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { PLATFORM_ROLES, USER_STATUSES } from '../../constants';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    avatar: { type: String, trim: true, maxlength: 500 },
    phone: { type: String, trim: true, maxlength: 30 },
    status: { type: String, enum: USER_STATUSES, default: 'ACTIVE' },
    emailVerified: { type: Boolean, default: false },
    platformRole: { type: String, enum: PLATFORM_ROLES, default: 'NONE' },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const User = model('User', userSchema);