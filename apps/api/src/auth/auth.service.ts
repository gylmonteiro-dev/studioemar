import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  authSessionSchema,
  recoverAcceptedSchema,
  type AuthSession,
  type FirstAccessRequest,
  type LoginRequest,
  type RecoverRequest,
  type ResetPasswordRequest,
} from '@studioemar/shared';
import { compare, hash } from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { toUser } from '../common/mappers';
import { PrismaService } from '../prisma/prisma.service';
import type { RefreshTokenPayload } from './auth.types';

const ACCESS_TTL_SECONDS = 60 * 60;
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7;
const RESET_TTL_MS = 60 * 60 * 1000;
const BCRYPT_ROUNDS = 10;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(input: LoginRequest): Promise<AuthSession> {
    const user = await this.findByEmail(input.email);
    if (!user || user.mustSetPassword || !user.passwordHash) {
      if (user?.mustSetPassword) {
        throw new UnauthorizedException({
          code: 'MUST_SET_PASSWORD',
          message: 'Defina sua senha no primeiro acesso.',
        });
      }
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const matches = await compare(input.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.issueSession(user);
  }

  async firstAccess(input: FirstAccessRequest): Promise<AuthSession> {
    const user = await this.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException(
        'Conta não encontrada. Fale com o Studio.',
      );
    }
    if (!user.mustSetPassword) {
      throw new ConflictException('Esta conta já possui senha. Faça login.');
    }

    const passwordHash = await hash(input.password, BCRYPT_ROUNDS);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustSetPassword: false,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });
    return this.issueSession(updated);
  }

  async recover(input: RecoverRequest): Promise<{ ok: true }> {
    const user = await this.findByEmail(input.email);
    if (user) {
      const token = randomBytes(32).toString('hex');
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: sha256(token),
          passwordResetExpiresAt: new Date(Date.now() + RESET_TTL_MS),
        },
      });
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`Token de recuperação (dev) para ${user.email}: ${token}`);
      }
    }
    return recoverAcceptedSchema.parse({ ok: true });
  }

  async resetPassword(input: ResetPasswordRequest): Promise<AuthSession> {
    const tokenHash = sha256(input.token);
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });
    if (!user) {
      throw new UnauthorizedException('Token de recuperação inválido ou expirado');
    }

    const passwordHash = await hash(input.password, BCRYPT_ROUNDS);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustSetPassword: false,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });
    return this.issueSession(updated);
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwt.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.refreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Sessão inválida');
    }
    if (payload.typ !== 'refresh' || !payload.sub) {
      throw new UnauthorizedException('Sessão inválida');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.mustSetPassword) {
      throw new UnauthorizedException('Sessão inválida');
    }
    return this.issueSession(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Sessão inválida');
    }
    return toUser(user);
  }

  private async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  private issueSession(user: {
    id: string;
    email: string;
    role: AuthSession['user']['role'];
    name: string;
    planId: string | null;
    mustSetPassword: boolean;
    passwordHash?: string | null;
  }): AuthSession {
    const accessToken = this.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        typ: 'access',
      },
      {
        secret: this.accessSecret(),
        expiresIn: ACCESS_TTL_SECONDS,
      },
    );
    const refreshToken = this.jwt.sign(
      { sub: user.id, typ: 'refresh' },
      {
        secret: this.refreshSecret(),
        expiresIn: REFRESH_TTL_SECONDS,
      },
    );

    return authSessionSchema.parse({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TTL_SECONDS,
      user: toUser(user),
    });
  }

  private accessSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET não configurado');
    }
    return secret;
  }

  private refreshSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET não configurado');
    }
    return secret;
  }
}
