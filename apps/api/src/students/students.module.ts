import { Module } from '@nestjs/common';
import { CreditsModule } from '../credits/credits.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [CreditsModule, SchedulesModule],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
