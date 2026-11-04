import type { CrmService } from './crm-service';
import { mockCrmService } from './mock-crm-service';

// Phase 3: replace with an HTTP-backed implementation of CrmService.
export const crmService: CrmService = mockCrmService;