import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  addRecurringSlotRequestSchema,
  createStudioClosureRequestSchema,
  type AddRecurringSlotRequest,
  type CreateStudioClosureRequest,
} from '@studioemar/shared';
import { CurrentUser } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import type { AuthUser } from '../auth/auth.types';
import { SchedulesService } from './schedules.service';

@ApiTags('schedules')
@ApiBearerAuth()
@Controller()
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get('time-slots')
  @ApiOperation({ summary: 'Horários e vagas' })
  listTimeSlots() {
    return this.schedules.listTimeSlots();
  }

  @Get('time-slots/:id')
  @ApiOperation({ summary: 'Detalhe do horário' })
  getTimeSlot(@Param('id') id: string) {
    return this.schedules.getTimeSlot(id);
  }

  @Get('time-slots/:id/bookings')
  @Roles('TRAINER')
  @ApiOperation({ summary: 'Participantes do horário (treinador)' })
  listSlotBookings(@Param('id') id: string) {
    return this.schedules.listSlotBookings(id);
  }

  @Get('time-slots/:id/waitlist')
  @Roles('TRAINER')
  @ApiOperation({ summary: 'Lista de espera FIFO (treinador)' })
  listWaitlist(@Param('id') id: string) {
    return this.schedules.listWaitlist(id);
  }

  @Get('recurring-slots')
  @Roles('TRAINER')
  @ApiOperation({ summary: 'Agenda recorrente' })
  listRecurring() {
    return this.schedules.listRecurringSlots();
  }

  @Post('recurring-slots')
  @Roles('TRAINER')
  @ApiOperation({ summary: 'Incluir horário recorrente' })
  addRecurring(
    @Body(new ZodValidationPipe(addRecurringSlotRequestSchema))
    body: AddRecurringSlotRequest,
  ) {
    return this.schedules.addRecurringSlot(body);
  }

  @Delete('recurring-slots/:id')
  @HttpCode(204)
  @Roles('TRAINER')
  @ApiOperation({ summary: 'Remover horário recorrente' })
  async removeRecurring(@Param('id') id: string) {
    await this.schedules.removeRecurringSlot(id);
  }

  @Get('closures')
  @Roles('TRAINER')
  @ApiOperation({ summary: 'Fechamentos do Studio' })
  listClosures() {
    return this.schedules.listClosures();
  }

  @Post('closures')
  @Roles('TRAINER')
  @ApiOperation({ summary: 'Informar fechamento (RN-014 / RN-019)' })
  createClosure(
    @Body(new ZodValidationPipe(createStudioClosureRequestSchema))
    body: CreateStudioClosureRequest,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schedules.createClosure(body, user.id);
  }
}
