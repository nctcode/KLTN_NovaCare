import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Bác sĩ')
@Controller('api/v1/doctors')
export class DoctorsController {
  constructor(private readonly service: DoctorsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tạo bác sĩ mới' })
  async create(@Body() createDto: CreateDoctorDto) {
    const data = await this.service.create(createDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo bác sĩ thành công',
      data,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bác sĩ có bộ lọc' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Lọc theo cơ sở y tế' })
  @ApiQuery({ name: 'specialtyId', required: false, description: 'Lọc theo chuyên khoa' })
  @ApiQuery({ name: 'query', required: false, description: 'Từ khóa tìm kiếm' })
  @ApiQuery({ name: 'q', required: false, description: 'Từ khóa tìm kiếm' })
  async findAll(
    @Query('hospitalId') hospitalId?: string,
    @Query('specialtyId') specialtyId?: string,
    @Query('query') query?: string,
    @Query('q') q?: string,
  ) {
    const searchTerm = q || query;
    const data = await this.service.findFiltered({
      q: searchTerm,
      hospitalId,
      specialtyId,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách bác sĩ thành công',
      data,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết bác sĩ' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOneWithWorkplaces(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết bác sĩ thành công',
      data,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cập nhật bác sĩ' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateDoctorDto) {
    const data = await this.service.update(id, updateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật thông tin bác sĩ thành công',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xóa bác sĩ (xóa mềm)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Xóa bác sĩ thành công',
    };
  }

  @Get(':id/available-slots')
  @Public()
  @ApiOperation({ summary: 'Lấy khung giờ trống của bác sĩ' })
  @ApiQuery({ name: 'date', required: true, description: 'Ngày (YYYY-MM-DD)' })
  @ApiQuery({ name: 'workplaceId', required: true, description: 'ID nơi làm việc' })
  async getAvailableSlots(
    @Param('id') id: string,
    @Query('date') date: string,
    @Query('workplaceId') workplaceId: string
  ) {
    const data = await this.service.getAvailableSlots(
      id,
      workplaceId,
      new Date(date)
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy khung giờ trống thành công',
      data,
    };
  }
}
