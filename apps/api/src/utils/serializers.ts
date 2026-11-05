import type { Types } from 'mongoose';

type Id = Types.ObjectId | string;

export interface UserLike {
  _id: Id;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  status: string;
  emailVerified: boolean;
  platformRole: string;
}

export const toUserDto = (u: UserLike) => ({
  _id: String(u._id),
  name: u.name,
  email: u.email,
  phone: u.phone ?? undefined,
  avatar: u.avatar ?? undefined,
  status: u.status,
  emailVerified: u.emailVerified,
  platformRole: u.platformRole,
});

export interface OrganizationLike {
  _id: Id;
  name: string;
  slug: string;
  logo?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: {
    line1?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
  } | null;
  ownerId: Id;
  timezone: string;
  currency: string;
  status: string;
}

export const toOrganizationDto = (o: OrganizationLike) => ({
  _id: String(o._id),
  name: o.name,
  slug: o.slug,
  logo: o.logo ?? undefined,
  email: o.email ?? '',
  phone: o.phone ?? '',
  address: {
    line1: o.address?.line1 ?? '',
    city: o.address?.city ?? '',
    state: o.address?.state ?? '',
    country: o.address?.country ?? '',
    postalCode: o.address?.postalCode ?? '',
  },
  ownerId: String(o.ownerId),
  timezone: o.timezone,
  currency: o.currency,
  status: o.status,
});

export const toMembershipDto = (m: { organization: OrganizationLike; role: string; permissions: string[] }) => ({
  organization: toOrganizationDto(m.organization),
  role: m.role,
  permissions: m.permissions,
});