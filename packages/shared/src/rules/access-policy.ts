import type { UserRole } from '../schemas/enums.js';

const INHERITED_ROLES: Record<UserRole, readonly UserRole[]> = {
  STUDENT: ['STUDENT'],
  TRAINER: ['TRAINER'],
  ADMIN: ['TRAINER', 'ADMIN'],
  SUPERADMIN: ['TRAINER', 'ADMIN', 'SUPERADMIN'],
};

export function canActAsRole(
  actorRole: UserRole,
  allowedRoles: readonly UserRole[],
): boolean {
  return INHERITED_ROLES[actorRole].some((role) =>
    allowedRoles.includes(role),
  );
}

export function isOperatorRole(role: UserRole): boolean {
  return role !== 'STUDENT';
}
