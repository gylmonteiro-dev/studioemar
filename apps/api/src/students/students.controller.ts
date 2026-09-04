import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createStudentRequestSchema } from '@studioemar/shared';
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
  list() {
    return this.students.list();
  }

  @Post('students')
  @ApiOperation({ summary: 'Criar conta de aluno' })
  create(
    @Body(new ZodValidationPipe(createStudentRequestSchema))
    body: { name: string; email: string; planId: string },
  ) {
    return this.students.create(body);
  }

  @Get('students/:id')
  @ApiOperation({ summary: 'Detalhe do aluno' })
  getById(@Param('id') id: string) {
    return this.students.getById(id);
  }

  @Get('students/:id/bookings')
  @ApiOperation({ summary: 'Reservas do aluno' })
  listBookings(@Param('id') id: string) {
    return this.students.listBookings(id);
  }

  @Get('students/:id/credits')
  @ApiOperation({ summary: 'Créditos do aluno' })
  listCredits(@Param('id') id: string) {
    return this.students.listCredits(id);
  }
}
