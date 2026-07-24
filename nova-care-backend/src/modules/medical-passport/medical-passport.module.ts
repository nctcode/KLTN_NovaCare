import { Module } from '@nestjs/common';
import { PrismaModule } from '@/database/prisma.module';
import { MedicalPassportController } from './medical-passport.controller';
import { MedicalPassportService } from './medical-passport.service';

@Module({
  imports: [PrismaModule],
  controllers: [MedicalPassportController],
  providers: [MedicalPassportService],
  exports: [MedicalPassportService],
})
export class MedicalPassportModule {}
