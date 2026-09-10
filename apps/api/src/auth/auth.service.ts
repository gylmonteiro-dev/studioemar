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
  isValidCpf,
  normalizeCpf,
  type LoginRequest,
  type RecoverRequest,
  type ResetPasswordRequest,
} from '@studioemar/shared';
import { compare, hash } from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { toUser, toRegularSlotsFromRows } from '../common/mappers';
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
    const user = await this.findByIdentifier(input.identifier);
    if (!user || !user.isActive || user.mustSetPassword || !user.passwordHash) {
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

    return this.issueSession(user.id);
  }

  async firstAccess(input: FirstAccessRequest): Promise<AuthSession> {
    const user = await this.findByEmail(input.email);
    if (!user || !user.isActive) {
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
    return this.issueSession(updated.id);
  }

  async recover(input: RecoverRequest): Promise<{ ok: true }> {
    const user = await this.findByEmail(input.email);
    if (user?.isActive) {
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
        isActive: true,
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
    return this.issueSession(updated.id);
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
    if (!user || !user.isActive || user.mustSetPassword) {
      throw new UnauthorizedException('Sessão inválida');
    }
    return this.issueSession(user.id);
  }

  async me(userId: string) {
    const user = await this.loadPublicUser(userId);
    if (!user) {
      throw new UnauthorizedException('Sessão inválida');
    }
    return user;
  }

  private async findByIdentifier(identifier: string) {
    const value = identifier.trim();
    if (value.includes('@')) {
      return this.findByEmail(value);
    }
    const cpf = normalizeCpf(value);
    if (!isValidCpf(cpf)) {
      return null;
    }
    return this.prisma.user.findUnique({ where: { cpf } });
  }

  private async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  private async loadPublicUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentTrainerLinks: { select: { trainerId: true } },
        studentRegularSlots: { include: { studioHour: true } },
      },
    });
    if (!user || !user.isActive) {
      return null;
    }
    return toUser(
      user,
      user.studentTrainerLinks.map((link) => link.trainerId),
      toRegularSlotsFromRows(user.studentRegularSlots),
    );
  }

  private async issueSession(userId: string): Promise<AuthSession> {
    const publicUser = await this.loadPublicUser(userId);
    if (!publicUser) {
      throw new UnauthorizedException('Sessão inválida');
    }
    const accessToken = this.jwt.sign(
      {
        sub: publicUser.id,
        email: publicUser.email,
        role: publicUser.role,
        typ: 'access',
      },
      {
        secret: this.accessSecret(),
        expiresIn: ACCESS_TTL_SECONDS,
      },
    );
    const refreshToken = this.jwt.sign(
      { sub: publicUser.id, typ: 'refresh' },
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
      user: publicUser,
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
