import { Module } from '@nestjs/common';
import { PrismaModule } from '@/database/prisma.module';
import { AuditLogService } from '@/common/services/audit-log.service';

import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardController } from './admin-dashboard.controller';

import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';

import { AdminDoctorsService } from './admin-doctors.service';
import { AdminDoctorsController } from './admin-doctors.controller';

import { AdminHospitalsService } from './admin-hospitals.service';
import { AdminHospitalsController } from './admin-hospitals.controller';

import { AdminHealthPackagesService } from './admin-health-packages.service';
import { AdminHealthPackagesController } from './admin-health-packages.controller';

import { AdminAppointmentsService } from './admin-appointments.service';
import { AdminAppointmentsController } from './admin-appointments.controller';

import { AdminPaymentsService } from './admin-payments.service';
import { AdminPaymentsController } from './admin-payments.controller';

import { AdminSpecialtiesService } from './admin-specialties.service';
import { AdminSpecialtiesController } from './admin-specialties.controller';

import { AdminMedicalServicesService } from './admin-medical-services.service';
import { AdminMedicalServicesController } from './admin-medical-services.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminDoctorsController,
    AdminHospitalsController,
    AdminHealthPackagesController,
    AdminAppointmentsController,
    AdminPaymentsController,
    AdminSpecialtiesController,
    AdminMedicalServicesController,
  ],
  providers: [
    AuditLogService,
    AdminDashboardService,
    AdminUsersService,
    AdminDoctorsService,
    AdminHospitalsService,
    AdminHealthPackagesService,
    AdminAppointmentsService,
    AdminPaymentsService,
    AdminSpecialtiesService,
    AdminMedicalServicesService,
  ],
  exports: [
    AuditLogService,
    AdminDashboardService,
    AdminUsersService,
    AdminDoctorsService,
    AdminHospitalsService,
    AdminHealthPackagesService,
    AdminAppointmentsService,
    AdminPaymentsService,
    AdminSpecialtiesService,
    AdminMedicalServicesService,
  ],
})
export class AdminModule {}
