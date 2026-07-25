import { Module } from '@nestjs/common';
import { HealthPackagesService } from './health-packages.service';
import { HealthPackagesController } from './health-packages.controller';

@Module({
  controllers: [HealthPackagesController],
  providers: [HealthPackagesService],
  exports: [HealthPackagesService],
})
export class HealthPackagesModule {}
