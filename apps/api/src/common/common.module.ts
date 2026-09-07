import { Global, Module } from '@nestjs/common';
import { Clock } from './clock';
import { StudentAccessService } from './student-access.service';

@Global()
@Module({
  providers: [Clock, StudentAccessService],
  exports: [Clock, StudentAccessService],
})
export class CommonModule {}
