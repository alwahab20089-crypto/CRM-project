# Business Rules

## Ownership and tenancy
- BR-1 Every lead, contact, property, task, activity, and notification belongs to exactly one organization.
- BR-2 Cross-references (assignee, owner contact, related entities) must be in the same organization.
- BR-3 A user may belong to many organizations (SaaS); self-hosted has one organization.
- BR-4 An organization has exactly one OWNER. Ownership changes only via explicit transfer.
- BR-5 The OWNER cannot be removed, demoted, or delete their account until ownership is transferred.

## Members and roles
- BR-6 Only roles with `members:*` permission manage members. ADMIN cannot modify OWNER or other ADMIN-level
  elevation beyond their own role.
- BR-7 Users cannot change their own role or permissions.
- BR-8 Invitation tokens are single-use, hashed, and expire (e.g., 7 days).
- BR-9 Deleting or removing a user **never** deletes organization data. Their records remain and are
  reassigned or left unassigned. Authorship (`createdBy`) is preserved.
- BR-10 Member count must respect plan limit (SaaS) or `maxUsers` (self-hosted).

## Leads
- BR-11 A lead has at most one assignee, who must be an active member.
- BR-12 Status transitions are free-form forward and backward except: WON and LOST are terminal and
  can be reopened only by MANAGER+ with a reason (recorded as activity + audit).
- BR-13 Moving to WON sets `wonAt`; LOST requires `lostReason` and sets `lostAt`.
- BR-14 Won and lost leads are never hard-deleted by users. History is preserved.
- BR-15 Every status change creates a STATUS_CHANGE activity.
- BR-16 Converting a lead creates a contact (data copied, `leadId` linked, `convertedContactId` set); the lead keeps its history.
- BR-17 Duplicate warning (not block) when phone or email matches an existing lead in the same organization.
- BR-18 Agents see and edit only their assigned leads unless granted `leads:read_all`.

## Contacts and properties
- BR-19 A property may reference one owner contact; a contact may own many properties.
- BR-20 SOLD/RENTED properties remain visible in history but are excluded from default "available" listings.
- BR-21 Price must be > 0; listing type RENT and SALE use consistent currency from the organization unless overridden.
- BR-22 A property with active tasks or an owner link cannot be hard-deleted. It is soft-deleted or set INACTIVE.

## Tasks and notifications
- BR-23 Tasks may link to a lead, contact, and/or property, all in the same organization.
- BR-24 Completing a task sets `completedAt`; reopening clears it.
- BR-25 Assignment and due-today tasks generate notifications for the assignee.

## Activities and audit
- BR-26 Activities are append-only for users (no edit/delete); corrections are new entries.
- BR-27 Every important mutation (member/role/org/billing/license/bulk/delete) creates an audit log.
- BR-28 Audit logs cannot be modified through the application.

## Analytics and permissions
- BR-29 Analytics are computed only over the active organization's data; access requires `analytics:read`.
- BR-30 Agents may see only their own performance numbers.

## Commercial
- BR-31 Limits and features are checked server-side on every relevant write.
- BR-32 When a subscription or license lapses, the system degrades to read-only. Data is never auto-deleted.
- BR-33 Billing state changes only from verified provider events (SaaS) or validated licenses (self-hosted).
- BR-34 Deletion of an organization is a soft delete with a retention window before permanent purge.