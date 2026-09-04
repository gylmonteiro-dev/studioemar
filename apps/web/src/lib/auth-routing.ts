import type { User, UserRole } from '@studioemar/shared';

export function isTrainerRole(role: UserRole): boolean {
  return role === 'TRAINER' || role === 'ADMIN';
}

export function homePathForRole(role: UserRole): string {
  return isTrainerRole(role) ? '/treinador' : '/aluno';
}

export function homePathForUser(user: User): string {
  return homePathForRole(user.role);
}
