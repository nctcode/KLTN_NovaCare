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
import { HospitalsService } from './hospitals.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Cơ sở y tế')
@Controller('api/v1/hospitals')
export class HospitalsController {
  constructor(private readonly service: HospitalsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tạo cơ sở y tế mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async create(@Body() createDto: CreateHospitalDto) {
    const data = await this.service.create(createDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo cơ sở y tế thành công',
      data,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách cơ sở y tế' })
  @ApiQuery({ name: 'query', required: false, description: 'Từ khóa tìm kiếm' })
  @ApiQuery({ name: 'specialtyId', required: false, description: 'Lọc theo chuyên khoa' })
  async findAll(
    @Query('query') query?: string,
    @Query('specialtyId') specialtyId?: string
  ) {
    let data;
    if (query) {
      data = await this.service.search(query);
    } else if (specialtyId) {
      data = await this.service.findBySpecialty(specialtyId);
    } else {
      data = await this.service.findAll();
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách cơ sở y tế thành công',
      data,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết cơ sở y tế' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết cơ sở y tế thành công',
      data,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cập nhật cơ sở y tế' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateHospitalDto) {
    const data = await this.service.update(id, updateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật cơ sở y tế thành công',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xóa cơ sở y tế (xóa mềm)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Xóa cơ sở y tế thành công',
    };
  }

  @Get(':id/specialties')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách chuyên khoa của cơ sở' })
  async getSpecialties(@Param('id') id: string) {
    const data = await this.service.getAvailableSpecialties(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách chuyên khoa thành công',
      data,
    };
  }

  @Get(':id/specialties/:specialtyId/doctors')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách bác sĩ thuộc chuyên khoa tại cơ sở y tế' })
  async getDoctorsBySpecialty(
    @Param('id') hospitalId: string,
    @Param('specialtyId') specialtyId: string,
  ) {
    const data = await this.service.getDoctorsBySpecialty(hospitalId, specialtyId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách bác sĩ theo chuyên khoa thành công',
      data,
    };
  }
}
