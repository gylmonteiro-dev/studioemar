import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@studioemar/shared';
import { ROLES_KEY } from '../common/roles.decorator';
import type { AuthUser } from './auth.types';

function canActAs(role: UserRole, allowed: UserRole[]): boolean {
  if (allowed.includes(role)) {
    return true;
  }
  return role === 'ADMIN' && allowed.includes('TRAINER');
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!allowed || allowed.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user || !canActAs(user.role, allowed)) {
      throw new ForbiddenException('Sem permissão');
    }
    return true;
  }
}
