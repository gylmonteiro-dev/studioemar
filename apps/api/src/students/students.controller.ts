import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createStudentRequestSchema,
  updateStudentTrainersRequestSchema,
  type CreateStudentRequest,
  type UpdateStudentTrainersRequest,
} from '@studioemar/shared';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { StudentsService } from './students.service';

@ApiTags('students')
@ApiBearerAuth()
@Roles('TRAINER')
@Controller()
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Planos (cadastro de aluno)' })
  listPlans() {
    return this.students.listPlans();
  }

  @Get('students')
  @ApiOperation({ summary: 'Listar alunos' })
  list(@CurrentUser() user: AuthUser) {
    return this.students.list(user);
  }

  @Post('students')
  @ApiOperation({ summary: 'Criar conta de aluno' })
  create(
    @Body(new ZodValidationPipe(createStudentRequestSchema))
    body: CreateStudentRequest,
    @CurrentUser() user: AuthUser,
  ) {
    return this.students.create(body, user);
  }

  @Get('students/:id')
  @ApiOperation({ summary: 'Detalhe do aluno' })
  getById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.students.getById(id, user);
  }

  @Get('students/:id/bookings')
  @ApiOperation({ summary: 'Reservas do aluno' })
  listBookings(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.students.listBookings(id, user);
  }

  @Get('students/:id/credits')
  @ApiOperation({ summary: 'Créditos do aluno' })
  listCredits(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.students.listCredits(id, user);
  }

  @Put('students/:id/trainers')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Substituir treinadores vinculados' })
  updateTrainers(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateStudentTrainersRequestSchema))
    body: UpdateStudentTrainersRequest,
    @CurrentUser() user: AuthUser,
  ) {
    return this.students.updateTrainers(id, body, user);
  }
}
