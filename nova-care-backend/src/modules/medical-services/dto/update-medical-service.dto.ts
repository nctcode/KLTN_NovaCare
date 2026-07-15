import { PartialType } from '@nestjs/swagger';
import { CreateMedicalServiceDto } from './create-medical-service.dto';

export class UpdateMedicalServiceDto extends PartialType(CreateMedicalServiceDto) {}
