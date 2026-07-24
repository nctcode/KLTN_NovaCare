import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { ExpireAppointmentsProcessor } from './expire-appointments.processor';
import { EmailProcessor, PushProcessor } from './email.processor';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') || 'localhost',
          port: config.get<number>('REDIS_PORT') || 6379,
          password: config.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'push' },
      { name: 'reminder' },
      { name: 'expire-appointments' },
    ),
  ],
  providers: [QueueService, ExpireAppointmentsProcessor, EmailProcessor, PushProcessor],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
