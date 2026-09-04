import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  firstAccessRequestSchema,
  loginRequestSchema,
  recoverRequestSchema,
  refreshRequestSchema,
  resetPasswordRequestSchema,
} from '@studioemar/shared';
import { CurrentUser } from '../common/current-user.decorator';
import { Public } from '../common/public.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';
import type { AuthUser } from './auth.types';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('auth/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login com e-mail e senha' })
  login(
    @Body(new ZodValidationPipe(loginRequestSchema))
    body: { email: string; password: string },
  ) {
    return this.auth.login(body);
  }

  @Public()
  @Post('auth/first-access')
  @HttpCode(200)
  @ApiOperation({ summary: 'Definir senha no primeiro acesso' })
  firstAccess(
    @Body(new ZodValidationPipe(firstAccessRequestSchema))
    body: { email: string; password: string; confirmPassword: string },
  ) {
    return this.auth.firstAccess(body);
  }

  @Public()
  @Post('auth/refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Renovar o access token' })
  refresh(
    @Body(new ZodValidationPipe(refreshRequestSchema))
    body: { refreshToken: string },
  ) {
    return this.auth.refresh(body.refreshToken);
  }

  @Public()
  @Post('auth/recover')
  @HttpCode(200)
  @ApiOperation({ summary: 'Pedir recuperação de senha' })
  recover(
    @Body(new ZodValidationPipe(recoverRequestSchema)) body: { email: string },
  ) {
    return this.auth.recover(body);
  }

  @Public()
  @Post('auth/reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Definir senha com token de recuperação' })
  resetPassword(
    @Body(new ZodValidationPipe(resetPasswordRequestSchema))
    body: { token: string; password: string; confirmPassword: string },
  ) {
    return this.auth.resetPassword(body);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuário autenticado' })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
