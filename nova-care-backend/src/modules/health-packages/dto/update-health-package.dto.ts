import { PartialType } from '@nestjs/swagger';
import { CreateHealthPackageDto } from './create-health-package.dto';

export class UpdateHealthPackageDto extends PartialType(CreateHealthPackageDto) {}
