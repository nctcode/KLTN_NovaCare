import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DoctorSchedulesService } from './doctor-schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Lịch làm việc cố định của bác sĩ')
@Controller('api/v1/doctor-schedules')
export class DoctorSchedulesController {
  constructor(private readonly service: DoctorSchedulesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tạo lịch làm việc cố định mới' })
  async create(@Body() createDto: CreateScheduleDto) {
    const data = await this.service.create(createDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo lịch làm việc thành công',
      data,
    };
  }

  @Public()
  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Lấy lịch làm việc cố định của bác sĩ' })
  async findByDoctor(@Param('doctorId') doctorId: string) {
    const data = await this.service.findByDoctor(doctorId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách lịch làm việc thành công',
      data,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một lịch làm việc' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết lịch làm việc thành công',
      data,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cập nhật lịch làm việc cố định' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateScheduleDto) {
    const data = await this.service.update(id, updateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật lịch làm việc thành công',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xóa lịch làm việc cố định (vô hiệu hóa)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Xóa lịch làm việc thành công',
    };
  }
}
