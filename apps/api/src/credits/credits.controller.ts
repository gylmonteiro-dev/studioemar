import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  redeemCreditRequestSchema,
  type RedeemCreditRequest,
} from '@studioemar/shared';
import { CurrentUser } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import type { AuthUser } from '../auth/auth.types';
import { CreditsService } from './credits.service';

@ApiTags('credits')
@ApiBearerAuth()
@Controller()
export class CreditsController {
  constructor(private readonly credits: CreditsService) {}

  @Get('me/credits')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Créditos do aluno autenticado' })
  listMine(@CurrentUser() user: AuthUser) {
    return this.credits.listMine(user.id);
  }

  @Get('credits')
  @Roles('TRAINER')
  @ApiOperation({ summary: 'Todos os créditos (treinador)' })
  listAll() {
    return this.credits.listAll();
  }

  @Post('credits/:id/redemptions')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Usar crédito em horário disponível' })
  redeem(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(redeemCreditRequestSchema))
    body: RedeemCreditRequest,
    @CurrentUser() user: AuthUser,
  ) {
    return this.credits.redeem(id, user.id, body);
  }

  @Post('credits/:id/annulments')
  @HttpCode(200)
  @Roles('TRAINER')
  @ApiOperation({ summary: 'Anular crédito (RN-018)' })
  annul(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.credits.annul(id, user.id);
  }
}
