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
import { HealthPackagesService } from './health-packages.service';
import { CreateHealthPackageDto } from './dto/create-health-package.dto';
import { UpdateHealthPackageDto } from './dto/update-health-package.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Gói khám sức khỏe')
@Controller('api/v1/health-packages')
export class HealthPackagesController {
  constructor(private readonly service: HealthPackagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tạo gói khám sức khỏe mới' })
  async create(@Body() createDto: CreateHealthPackageDto) {
    const data = await this.service.create(createDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo gói khám sức khỏe thành công',
      data,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách gói khám sức khỏe' })
  async findAll(@Query('hospitalId') hospitalId?: string) {
    let data;
    if (hospitalId) {
      data = await this.service.findByHospital(hospitalId);
    } else {
      data = await this.service.findAll();
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách gói khám sức khỏe thành công',
      data,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết gói khám sức khỏe' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết gói khám thành công',
      data,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cập nhật gói khám sức khỏe' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateHealthPackageDto) {
    const data = await this.service.update(id, updateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật gói khám thành công',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xóa gói khám sức khỏe (ẩn)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Xóa gói khám thành công',
    };
  }
}
