import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { DeviceTokenService } from './device-token.service';
import { FcmService } from './fcm.service';
import { NotificationsController } from './notifications.controller';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, DeviceTokenService, FcmService],
  exports: [NotificationsService, DeviceTokenService, FcmService],
})
export class NotificationsModule {}
