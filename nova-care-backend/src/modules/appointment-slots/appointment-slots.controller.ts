import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AppointmentSlotsService } from './appointment-slots.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { GenerateSlotsDto } from './dto/generate-slots.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Khung giờ khám')
@Controller('api/v1/appointment-slots')
export class AppointmentSlotsController {
  constructor(private readonly service: AppointmentSlotsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tạo khung giờ khám đơn lẻ' })
  async create(@Body() createDto: CreateSlotDto) {
    const data = await this.service.create(createDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo khung giờ khám thành công',
      data,
    };
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tự động tạo các khung giờ khám từ lịch làm việc cố định' })
  async generateSlots(@Body() generateDto: GenerateSlotsDto) {
    const result = await this.service.generateSlots(
      generateDto.doctorId,
      generateDto.doctorWorkplaceId,
      new Date(generateDto.startDate),
      new Date(generateDto.endDate),
      generateDto.slotDuration,
      generateDto.capacity
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tự động tạo khung giờ khám thành công',
      data: result,
    };
  }

  @Public()
  @Get('available')
  @ApiOperation({ summary: 'Lấy các khung giờ khám trống' })
  @ApiQuery({ name: 'doctorWorkplaceId', required: true, description: 'ID nơi làm việc của bác sĩ' })
  @ApiQuery({ name: 'date', required: true, description: 'Ngày khám (YYYY-MM-DD)' })
  async getAvailableSlots(
    @Query('doctorWorkplaceId') doctorWorkplaceId: string,
    @Query('date') date: string
  ) {
    const data = await this.service.getAvailableSlots(doctorWorkplaceId, new Date(date));
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách khung giờ trống thành công',
      data,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một khung giờ khám' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết khung giờ thành công',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xóa khung giờ khám' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Xóa khung giờ khám thành công',
    };
  }
}
