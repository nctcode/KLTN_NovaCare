import { Module } from '@nestjs/common';
import { HospitalBranchesService } from './hospital-branches.service';
import { HospitalBranchesController } from './hospital-branches.controller';

@Module({
  controllers: [HospitalBranchesController],
  providers: [HospitalBranchesService],
  exports: [HospitalBranchesService],
})
export class HospitalBranchesModule {}
