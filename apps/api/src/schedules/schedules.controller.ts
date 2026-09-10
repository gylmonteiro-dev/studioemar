import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  addRecurringSlotRequestSchema,
  createClassTypeRequestSchema,
  createStudioClosureRequestSchema,
  createStudioHourRequestSchema,
  createTimeSlotRequestSchema,
  cancelTimeSlotRequestSchema,
  updateStudioHourRequestSchema,
  updateTimeSlotRequestSchema,
  type CancelTimeSlotRequest,
  type AddRecurringSlotRequest,
  type CreateClassTypeRequest,
  type CreateStudioClosureRequest,
  type CreateStudioHourRequest,
  type CreateTimeSlotRequest,
  type UpdateStudioHourRequest,
  type UpdateTimeSlotRequest,
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
  listTimeSlots(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.schedules.listTimeSlots(
      user,
      from || to ? { from: from ?? '', to: to ?? '' } : undefined,
    );
  }

  @Post('time-slots')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Incluir horário pontual' })
  createTimeSlot(
    @Body(new ZodValidationPipe(createTimeSlotRequestSchema))
    body: CreateTimeSlotRequest,
  ) {
    return this.schedules.createTimeSlot(body);
  }

  @Get('time-slots/:id')
  @ApiOperation({ summary: 'Detalhe do horário' })
  getTimeSlot(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.schedules.getTimeSlot(id, user);
  }

  @Patch('time-slots/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Alterar horário pontual ou ocorrência' })
  updateTimeSlot(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTimeSlotRequestSchema))
    body: UpdateTimeSlotRequest,
  ) {
    return this.schedules.updateTimeSlot(id, body);
  }

  @Delete('time-slots/:id')
  @HttpCode(204)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Excluir horário sem alunos inscritos' })
  async deleteTimeSlot(@Param('id') id: string) {
    await this.schedules.deleteTimeSlot(id);
  }

  @Post('time-slots/:id/cancellations')
  @Roles('TRAINER')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Cancelar a ocorrência e deixar o horário indisponível',
  })
  cancelOccurrence(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(cancelTimeSlotRequestSchema))
    body: CancelTimeSlotRequest,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schedules.cancelOccurrence(id, user, body);
  }

  @Get('time-slots/:id/bookings')
  @Roles('TRAINER')
  @ApiOperation({ summary: 'Participantes do horário (treinador)' })
  listSlotBookings(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.schedules.listSlotBookings(id, user);
  }

  @Get('time-slots/:id/waitlist')
  @Roles('TRAINER')
  @ApiOperation({ summary: 'Lista de espera FIFO (treinador)' })
  listWaitlist(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.schedules.listWaitlist(id, user);
  }

  @Get('class-types')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tipos de aula cadastrados' })
  listClassTypes() {
    return this.schedules.listClassTypes();
  }

  @Post('class-types')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cadastrar tipo de aula' })
  createClassType(
    @Body(new ZodValidationPipe(createClassTypeRequestSchema))
    body: CreateClassTypeRequest,
  ) {
    return this.schedules.createClassType(body);
  }

  @Get('studio-hours')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Horários do estúdio' })
  listStudioHours() {
    return this.schedules.listStudioHours();
  }

  @Post('studio-hours')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar horário/turma do estúdio' })
  createStudioHour(
    @Body(new ZodValidationPipe(createStudioHourRequestSchema))
    body: CreateStudioHourRequest,
  ) {
    return this.schedules.createStudioHour(body);
  }

  @Patch('studio-hours/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Alterar horário/turma do estúdio' })
  updateStudioHour(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateStudioHourRequestSchema))
    body: UpdateStudioHourRequest,
  ) {
    return this.schedules.updateStudioHour(id, body);
  }

  @Delete('studio-hours/:id')
  @HttpCode(204)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Excluir horário/turma do estúdio e aulas futuras geradas',
  })
  async deleteStudioHour(
    @Param('id') id: string,
    @Query('confirmWithEnrolled') confirmWithEnrolled?: string,
  ) {
    await this.schedules.deleteStudioHour(
      id,
      confirmWithEnrolled === 'true',
    );
  }

  @Get('recurring-slots')
  @Roles('TRAINER')
  @ApiOperation({ summary: 'Agenda do plano' })
  listRecurring() {
    return this.schedules.listRecurringSlots();
  }

  @Post('recurring-slots')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Incluir horário do plano' })
  addRecurring(
    @Body(new ZodValidationPipe(addRecurringSlotRequestSchema))
    body: AddRecurringSlotRequest,
  ) {
    return this.schedules.addRecurringSlot(body);
  }

  @Delete('recurring-slots/:id')
  @HttpCode(204)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remover horário do plano' })
  async removeRecurring(@Param('id') id: string) {
    await this.schedules.removeRecurringSlot(id);
  }

  @Get('closures')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Fechamentos do Studio' })
  listClosures() {
    return this.schedules.listClosures();
  }

  @Post('closures')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Informar fechamento (RN-014 / RN-019)' })
  createClosure(
    @Body(new ZodValidationPipe(createStudioClosureRequestSchema))
    body: CreateStudioClosureRequest,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schedules.createClosure(body, user.id);
  }
}
