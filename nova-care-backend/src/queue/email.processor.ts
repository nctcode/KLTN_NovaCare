import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueService } from './queue.service';

@Processor('email')
@Injectable()
export class EmailProcessor extends WorkerHost {
  private logger = new Logger(EmailProcessor.name);

  constructor(private queueService: QueueService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { appointmentId, type } = job.data;
    this.logger.log(`Processing email job ${job.id} for appointment ${appointmentId} (${type})`);
    await this.queueService.processEmailDirect(appointmentId, type);
    return { success: true };
  }
}

@Processor('push')
@Injectable()
export class PushProcessor extends WorkerHost {
  private logger = new Logger(PushProcessor.name);

  constructor(private queueService: QueueService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { appointmentId, type } = job.data;
    this.logger.log(`Processing push job ${job.id} for appointment ${appointmentId}`);
    await this.queueService.processPushDirect(appointmentId, type);
    return { success: true };
  }
}
