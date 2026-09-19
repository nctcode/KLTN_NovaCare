import { Module } from '@nestjs/common';
import { IdentityMatchingController } from './identity-matching.controller';
import { IdentityMatchingService } from './identity-matching.service';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';
import { MedicalIntegrationController } from './medical-integration.controller';
import { MedicalIntegrationService } from './medical-integration.service';
import { InteroperabilityPortalController } from './interoperability-portal.controller';
import { InteroperabilityPortalService } from './interoperability-portal.service';
import { HospitalDataAdapter } from './hospital-data.adapter';
import { MedicalDataNormalizerService } from './medical-data-normalizer.service';
import { CatalogSyncController } from './catalog-sync/catalog-sync.controller';
import { CatalogSyncService } from './catalog-sync/catalog-sync.service';
import { CatalogNormalizerService } from './catalog-sync/catalog-normalizer.service';

@Module({
  controllers: [
    IdentityMatchingController,
    ConsentController,
    MedicalIntegrationController,
    InteroperabilityPortalController,
    CatalogSyncController,
  ],
  providers: [
    IdentityMatchingService,
    ConsentService,
    MedicalIntegrationService,
    InteroperabilityPortalService,
    HospitalDataAdapter,
    MedicalDataNormalizerService,
    CatalogSyncService,
    CatalogNormalizerService,
  ],
  exports: [
    IdentityMatchingService,
    ConsentService,
    MedicalIntegrationService,
    InteroperabilityPortalService,
    HospitalDataAdapter,
    MedicalDataNormalizerService,
    CatalogSyncService,
    CatalogNormalizerService,
  ],
})
export class IntegrationModule {}
