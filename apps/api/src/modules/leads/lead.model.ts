import { model, Schema, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES, LEAD_TYPES, MAX_MINOR_UNITS, PROPERTY_TYPES } from '../../constants';
import { isValidPhone } from '../../utils/phone';

const minorUnits = {
  type: Number,
  min: 0,
  max: MAX_MINOR_UNITS,
  validate: { validator: (v: number | null) => v == null || Number.isSafeInteger(v), message: 'must be a whole number of minor units' },
};
const phoneField = (required: boolean) => ({
  type: String,
  required,
  trim: true,
  maxlength: 20,
  validate: { validator: (v: string) => !v || isValidPhone(v), message: 'Enter a valid phone number' },
});

const leadSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    lastName: { type: String, trim: true, maxlength: 100, default: '' },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    phone: phoneField(true),
    alternatePhone: phoneField(false),
    leadSource: { type: String, enum: LEAD_SOURCES, required: true },
    leadType: { type: String, enum: LEAD_TYPES, required: true },
    status: { type: String, enum: LEAD_STATUSES, default: 'NEW' },
    priority: { type: String, enum: LEAD_PRIORITIES, default: 'MEDIUM' },
    budget: {
      min: minorUnits,
      max: minorUnits,
      currency: { type: String, uppercase: true, minlength: 3, maxlength: 3 },
    },
    preferredLocation: {
      type: [{ type: String, trim: true, maxlength: 100 }],
      default: [],
      validate: { validator: (v: string[]) => v.length <= 20, message: 'At most 20 locations' },
    },
    interestedPropertyType: { type: [{ type: String, enum: PROPERTY_TYPES }], default: [] },
    notes: { type: String, maxlength: 5000 },
    nextFollowUpAt: { type: Date },
    // lifecycle (Phase 1)
    convertedContactId: { type: Schema.Types.ObjectId }, // set by the conversion workflow in Phase 5
    wonAt: { type: Date },
    lostAt: { type: Date },
    lostReason: { type: String, maxlength: 500 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // soft delete
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    // internal, never serialized
    statusRank: { type: Number, default: 0 },
    priorityRank: { type: Number, default: 1 },
    nameSort: { type: String, default: '' },
    hasFollowUp: { type: Boolean, default: false },
    searchKeywords: { type: [String], default: [], select: false },
  },
  { timestamps: true },
);

leadSchema.pre('validate', function () {
  const budget = this.budget;
  if (budget?.min != null && budget?.max != null && budget.min > budget.max) {
    this.invalidate('budget.max', 'Maximum budget must be at least the minimum budget');
  }
});

// organizationId always leads the compound indexes (tenant isolation + performance)
leadSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
leadSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
leadSchema.index({ organizationId: 1, assignedTo: 1, status: 1 });
leadSchema.index({ organizationId: 1, hasFollowUp: -1, nextFollowUpAt: 1 });
leadSchema.index({ organizationId: 1, priorityRank: 1, createdAt: -1 });
leadSchema.index({ organizationId: 1, statusRank: 1, createdAt: -1 });
leadSchema.index({ organizationId: 1, nameSort: 1 });
leadSchema.index({ organizationId: 1, searchKeywords: 1 });
leadSchema.index({ organizationId: 1, phone: 1 });
leadSchema.index({ organizationId: 1, email: 1 }, { sparse: true });

export type LeadDoc = HydratedDocument<InferSchemaType<typeof leadSchema>>;
export const Lead = model('Lead', leadSchema);