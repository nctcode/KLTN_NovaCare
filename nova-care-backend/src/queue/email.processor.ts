import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from './queue.service';

@Injectable()
export class EmailProcessor {
  private logger = new Logger(EmailProcessor.name);
  constructor(private queueService: QueueService) {}

  async process(jobData: any): Promise<any> {
    const { appointmentId, type } = jobData;
    this.logger.log(`Processing email job for appointment ${appointmentId} (${type})`);
    await this.queueService.processEmailDirect(appointmentId, type);
    return { success: true };
  }
}

@Injectable()
export class PushProcessor {
  private logger = new Logger(PushProcessor.name);
  constructor(private queueService: QueueService) {}

  async process(jobData: any): Promise<any> {
    const { appointmentId, type } = jobData;
    this.logger.log(`Processing push job for appointment ${appointmentId}`);
    await this.queueService.processPushDirect(appointmentId, type);
    return { success: true };
  }
}
