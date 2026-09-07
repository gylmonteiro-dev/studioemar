import type { User, UserRole } from '@studioemar/shared';

export function isTrainerRole(role: UserRole): boolean {
  return role === 'TRAINER' || role === 'ADMIN' || role === 'SUPERADMIN';
}

export function canManageAccess(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

export function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    STUDENT: 'Aluno',
    TRAINER: 'Professor/Treinador',
    ADMIN: 'Proprietário',
    SUPERADMIN: 'Administrador',
  };
  return labels[role];
}

export function homePathForRole(role: UserRole): string {
  return isTrainerRole(role) ? '/treinador' : '/aluno';
}

export function homePathForUser(user: User): string {
  return homePathForRole(user.role);
}
