import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { Public } from '@/common/decorators/public.decorator';

@Controller('api/v1/booking')
export class BookingController {
  constructor(private availabilityService: AvailabilityService) {}

  @Public()
  @Get('availability')
  async getAvailability(
    @Query('doctorWorkplaceId') doctorWorkplaceId: string,
    @Query('date') date: string,
    @Query('medicalServiceId') medicalServiceId?: string,
  ) {
    if (!doctorWorkplaceId || !date) {
      throw new BadRequestException('doctorWorkplaceId and date are required query parameters');
    }

    return this.availabilityService.getAvailabilityOptions({
      doctorWorkplaceId,
      date,
      medicalServiceId,
    });
  }
}
