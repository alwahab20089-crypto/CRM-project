import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { requireMembership } from '../../middleware/require-membership';
import { resolveOrganization } from '../../middleware/resolve-organization';
import { validate } from '../../middleware/validate';
import * as controller from './organization.controller';
import { createOrganizationSchema, updateOrganizationSchema } from './organization.validation';

const router = Router();

// Order: authenticate -> resolveOrganization -> requireMembership -> authorize -> validate -> controller
router.use(authenticate);
router.get('/', controller.list);
router.post('/', validate({ body: createOrganizationSchema }), controller.create);

const scoped = Router();
scoped.get('/', authorize('org:read'), controller.get);
scoped.patch('/', authorize('org:update'), validate({ body: updateOrganizationSchema }), controller.update);
scoped.post('/switch', authorize('org:read'), controller.switchTo);

router.use('/:organizationId', resolveOrganization('param'), requireMembership, scoped);

export { router as organizationRouter };