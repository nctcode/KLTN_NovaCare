import { Module, Global } from '@nestjs/common';
import { QueueService } from './queue.service';
import { ExpireAppointmentsProcessor } from './expire-appointments.processor';
import { EmailProcessor, PushProcessor } from './email.processor';

@Global()
@Module({
  providers: [QueueService, ExpireAppointmentsProcessor, EmailProcessor, PushProcessor],
  exports: [QueueService],
})
export class QueueModule {}
