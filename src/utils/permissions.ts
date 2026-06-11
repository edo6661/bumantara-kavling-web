import type { Permission, User } from '../types/models/user';

export type PermissionFlags = Pick<
  Permission,
  'canCreate' | 'canRead' | 'canUpdate' | 'canDelete'
>;

const FULL_ACCESS: PermissionFlags = {
  canCreate: true,
  canRead: true,
  canUpdate: true,
  canDelete: true,
};

const NO_ACCESS: PermissionFlags = {
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canDelete: false,
};

/** Default akses mandor — selaras dengan rolePermissionSeed & API backend */
const MANDOR_ROLE_DEFAULTS: Record<string, PermissionFlags> = {
  PENJUALAN: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  SPK: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  PROGRESS_PROYEK: { canCreate: false, canRead: true, canUpdate: true, canDelete: false },
};

/** Default akses pengawas — selaras dengan rolePermissionSeed & API backend */
const PENGAWAS_ROLE_DEFAULTS: Record<string, PermissionFlags> = {
  SPK: { canCreate: false, canRead: true, canUpdate: true, canDelete: false },
  PROGRESS_PROYEK: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
};

export function resolvePermission(
  user: User | null | undefined,
  resource?: string,
): PermissionFlags {
  if (!resource) return FULL_ACCESS;
  if (user?.role === 'SUPERADMIN') return FULL_ACCESS;

  const normalized = resource.toUpperCase();
  const fromDb = user?.permissions?.find(
    (p) => p?.resource != null && p.resource.toUpperCase() === normalized,
  );

  if (fromDb) {
    return {
      canCreate: !!fromDb.canCreate,
      canRead: !!fromDb.canRead,
      canUpdate: !!fromDb.canUpdate,
      canDelete: !!fromDb.canDelete,
    };
  }

  if (user?.role === 'MANDOR') {
    return MANDOR_ROLE_DEFAULTS[normalized] ?? NO_ACCESS;
  }

  if (user?.role === 'PENGAWAS') {
    return PENGAWAS_ROLE_DEFAULTS[normalized] ?? NO_ACCESS;
  }

  return NO_ACCESS;
}

export function canReadResource(user: User | null | undefined, resource: string): boolean {
  return resolvePermission(user, resource).canRead;
}
