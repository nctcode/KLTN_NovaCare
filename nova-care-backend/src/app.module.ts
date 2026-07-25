import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@/config/config.module';
import { PrismaModule } from '@/database/prisma.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { PatientProfilesModule } from '@/modules/patient-profiles/patient-profiles.module';
import { SpecialtiesModule } from '@/modules/specialties/specialties.module';
import { HospitalsModule } from '@/modules/hospitals/hospitals.module';
import { HospitalBranchesModule } from '@/modules/hospital-branches/hospital-branches.module';
import { DoctorsModule } from '@/modules/doctors/doctors.module';
import { DoctorWorkplacesModule } from '@/modules/doctor-workplaces/doctor-workplaces.module';
import { MedicalServicesModule } from '@/modules/medical-services/medical-services.module';
import { DoctorSchedulesModule } from '@/modules/doctor-schedules/doctor-schedules.module';
import { AppointmentSlotsModule } from '@/modules/appointment-slots/appointment-slots.module';
import { AppointmentsModule } from '@/modules/appointments/appointments.module';
import { EmailModule } from '@/modules/email/email.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { QueueModule } from '@/queue/queue.module';
import { PreExamModule } from '@/modules/pre-exam/pre-exam.module';
import { MedicalPassportModule } from '@/modules/medical-passport/medical-passport.module';
import { HealthPackagesModule } from '@/modules/health-packages/health-packages.module';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    EmailModule,
    NotificationsModule,
    QueueModule,
    AuthModule,
    UsersModule,
    PatientProfilesModule,
    SpecialtiesModule,
    HospitalsModule,
    HospitalBranchesModule,
    DoctorsModule,
    DoctorWorkplacesModule,
    MedicalServicesModule,
    HealthPackagesModule,
    DoctorSchedulesModule,
    AppointmentSlotsModule,
    AppointmentsModule,
    PaymentsModule,
    PreExamModule,
    MedicalPassportModule,
  ],
})
export class AppModule {}
