import { Module } from '@nestjs/common';
import { IdentityMatchingController } from './identity-matching.controller';
import { IdentityMatchingService } from './identity-matching.service';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';
import { MedicalIntegrationController } from './medical-integration.controller';
import { MedicalIntegrationService } from './medical-integration.service';
import { HospitalDataAdapter } from './hospital-data.adapter';
import { MedicalDataNormalizerService } from './medical-data-normalizer.service';

@Module({
  controllers: [
    IdentityMatchingController,
    ConsentController,
    MedicalIntegrationController,
  ],
  providers: [
    IdentityMatchingService,
    ConsentService,
    MedicalIntegrationService,
    HospitalDataAdapter,
    MedicalDataNormalizerService,
  ],
  exports: [
    IdentityMatchingService,
    ConsentService,
    MedicalIntegrationService,
    HospitalDataAdapter,
    MedicalDataNormalizerService,
  ],
})
export class IntegrationModule {}
