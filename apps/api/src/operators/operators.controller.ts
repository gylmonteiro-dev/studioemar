import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createOperatorRequestSchema,
  updateOperatorRequestSchema,
  type CreateOperatorRequest,
  type UpdateOperatorRequest,
} from '@studioemar/shared';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { OperatorsService } from './operators.service';

@ApiTags('operators')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('operators')
export class OperatorsController {
  constructor(private readonly operators: OperatorsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar operadores gerenciáveis' })
  list(@CurrentUser() user: AuthUser) {
    return this.operators.list(user);
  }

  @Post()
  @ApiOperation({ summary: 'Criar conta de operador' })
  create(
    @Body(new ZodValidationPipe(createOperatorRequestSchema))
    body: CreateOperatorRequest,
    @CurrentUser() user: AuthUser,
  ) {
    return this.operators.create(body, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar conta de operador' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOperatorRequestSchema))
    body: UpdateOperatorRequest,
    @CurrentUser() user: AuthUser,
  ) {
    return this.operators.update(id, body, user);
  }
}
