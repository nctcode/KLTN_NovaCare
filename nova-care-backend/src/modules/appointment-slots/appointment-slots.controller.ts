import {
  Controller,
  Get,
  Post,
  Patch,
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
import { UpdateSlotDto } from './dto/update-slot.dto';
import { GenerateSlotsDto } from './dto/generate-slots.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Khung giờ khám')
@Controller('api/v1/appointment-slots')
export class AppointmentSlotsController {
  constructor(private readonly service: AppointmentSlotsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách khung giờ khám (Admin - Lọc theo ngày, bệnh viện, bác sĩ, chuyên khoa...)' })
  async findAll(
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('doctorWorkplaceId') doctorWorkplaceId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('hospitalId') hospitalId?: string,
    @Query('specialtyId') specialtyId?: string,
    @Query('isActive') isActive?: string,
    @Query('isAvailable') isAvailable?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.service.findAll({
      date,
      startDate,
      endDate,
      doctorWorkplaceId,
      doctorId,
      hospitalId,
      specialtyId,
      isActive,
      isAvailable,
      search,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách khung giờ khám thành công',
      data,
    };
  }

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
      generateDto.hospitalId,
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cập nhật khung giờ khám (Sức chứa, Khóa/Mở, Kích hoạt)' })
  async updateSlot(@Param('id') id: string, @Body() updateDto: UpdateSlotDto) {
    const data = await this.service.updateSlot(id, updateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật khung giờ khám thành công',
      data,
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
