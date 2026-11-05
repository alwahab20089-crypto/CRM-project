import { getAuth } from '../../middleware/authenticate';
import { getTenant } from '../../middleware/require-membership';
import { sendSuccess } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { getRequestMeta } from '../../utils/request-meta';
import * as leads from './lead.service';
import { activitiesQuerySchema, listLeadsQuerySchema } from './lead.validation';

const ctx = (req: Parameters<typeof getAuth>[0]) => ({ tenant: getTenant(req), userId: getAuth(req).userId, meta: getRequestMeta(req) });
const leadId = (req: { params: Record<string, string | string[] | undefined> }) => String(req.params.id);

export const list = asyncHandler(async (req, res) => {
  const { tenant, userId } = ctx(req);
  const result = await leads.listLeads(tenant, userId, listLeadsQuerySchema.parse(req.query)); // ZodError -> 422
  sendSuccess(res, { data: result.items, meta: result.meta });
});

export const create = asyncHandler(async (req, res) => {
  const { tenant, userId, meta } = ctx(req);
  const result = await leads.createLead(tenant, userId, req.body, meta);
  sendSuccess(res, { status: 201, message: 'Lead created', data: result.lead, meta: { duplicates: result.duplicates } });
});

export const get = asyncHandler(async (req, res) => {
  const { tenant, userId } = ctx(req);
  sendSuccess(res, { data: await leads.getLead(tenant, userId, leadId(req)) });
});

export const update = asyncHandler(async (req, res) => {
  const { tenant, userId, meta } = ctx(req);
  sendSuccess(res, { message: 'Lead updated', data: await leads.updateLead(tenant, userId, leadId(req), req.body, meta) });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { tenant, userId, meta } = ctx(req);
  sendSuccess(res, { message: 'Status updated', data: await leads.changeStatus(tenant, userId, leadId(req), req.body, meta) });
});

export const assign = asyncHandler(async (req, res) => {
  const { tenant, userId, meta } = ctx(req);
  sendSuccess(res, { message: 'Assignment updated', data: await leads.assignLead(tenant, userId, leadId(req), req.body.assignedTo, meta) });
});

export const remove = asyncHandler(async (req, res) => {
  const { tenant, userId, meta } = ctx(req);
  sendSuccess(res, { message: 'Lead archived', data: await leads.deleteLead(tenant, userId, leadId(req), meta) });
});

export const restore = asyncHandler(async (req, res) => {
  const { tenant, userId, meta } = ctx(req);
  sendSuccess(res, { message: 'Lead restored', data: await leads.restoreLead(tenant, userId, leadId(req), meta) });
});

export const addNote = asyncHandler(async (req, res) => {
  const { tenant, userId } = ctx(req);
  sendSuccess(res, { status: 201, message: 'Note added', data: await leads.addNote(tenant, userId, leadId(req), req.body.body) });
});

export const activities = asyncHandler(async (req, res) => {
  const { tenant, userId } = ctx(req);
  const result = await leads.listActivities(tenant, userId, leadId(req), activitiesQuerySchema.parse(req.query));
  sendSuccess(res, { data: result.items, meta: result.meta });
});