import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../common/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import type { AccessTokenPayload, AuthUser } from './auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthUser;
    }>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Sessão inválida');
    }

    const token = header.slice('Bearer '.length);
    try {
      const payload = this.jwt.verify<AccessTokenPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
      if (payload.typ !== 'access' || !payload.sub) {
        throw new UnauthorizedException('Sessão inválida');
      }
      const currentUser = this.prisma
        ? await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true, isActive: true },
          })
        : null;
      if (this.prisma && (!currentUser || !currentUser.isActive)) {
        throw new UnauthorizedException('Sessão inválida');
      }
      request.user = currentUser
        ? {
            id: currentUser.id,
            email: currentUser.email,
            role: currentUser.role,
          }
        : {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
          };
      return true;
    } catch {
      throw new UnauthorizedException('Sessão inválida');
    }
  }
}
