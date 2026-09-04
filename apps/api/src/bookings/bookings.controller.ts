import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import type { AuthUser } from '../auth/auth.types';
import { BookingsService } from './bookings.service';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller()
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get('me/bookings')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Agenda do aluno autenticado' })
  listMine(@CurrentUser() user: AuthUser) {
    return this.bookings.listMine(user.id);
  }

  @Post('bookings/:id/cancellations')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Cancelar reserva (aluno: RN-012; professor: crédito)',
  })
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.bookings.cancel(id, user);
  }
}
