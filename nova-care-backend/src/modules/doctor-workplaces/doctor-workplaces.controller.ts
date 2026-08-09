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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DoctorWorkplacesService } from './doctor-workplaces.service';
import { CreateWorkplaceDto } from './dto/create-workplace.dto';
import { UpdateWorkplaceDto } from './dto/update-workplace.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Nơi làm việc của bác sĩ')
@Controller('api/v1/doctor-workplaces')
export class DoctorWorkplacesController {
  constructor(private readonly service: DoctorWorkplacesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tạo liên kết nơi làm việc cho bác sĩ' })
  async create(@Body() createDto: CreateWorkplaceDto) {
    const data = await this.service.create(createDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo nơi làm việc thành công',
      data,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả nơi làm việc của các bác sĩ' })
  async findAll() {
    const data = await this.service.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách nơi làm việc thành công',
      data,
    };
  }

  @Public()
  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Lấy danh sách nơi làm việc của bác sĩ' })
  async findByDoctor(@Param('doctorId') doctorId: string) {
    const data = await this.service.findByDoctor(doctorId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách nơi làm việc thành công',
      data,
    };
  }

  @Public()
  @Get('hospital/:hospitalId')
  @ApiOperation({ summary: 'Lấy danh sách bác sĩ làm việc tại cơ sở' })
  async findByHospital(@Param('hospitalId') hospitalId: string) {
    const data = await this.service.findByHospital(hospitalId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách nơi làm việc thành công',
      data,
    };
  }

  @Public()
  @Get(':id/slots')
  @ApiOperation({ summary: 'Lấy danh sách khung giờ khám theo nơi làm việc' })
  async getSlots(@Param('id') id: string, @Query('date') date?: string) {
    const data = await this.service.getWorkplaceSlots(id, date);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy khung giờ khám thành công',
      data,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết nơi làm việc' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết nơi làm việc thành công',
      data,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cập nhật nơi làm việc' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateWorkplaceDto) {
    const data = await this.service.update(id, updateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật nơi làm việc thành công',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xóa nơi làm việc (ẩn)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Xóa nơi làm việc thành công',
    };
  }
}
