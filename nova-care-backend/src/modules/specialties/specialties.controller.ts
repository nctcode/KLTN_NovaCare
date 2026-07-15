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
import { SpecialtiesService } from './specialties.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Chuyên khoa')
@Controller('api/v1/specialties')
export class SpecialtiesController {
  constructor(private readonly service: SpecialtiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tạo chuyên khoa mới' })
  async create(@Body() createDto: CreateSpecialtyDto) {
    const data = await this.service.create(createDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo chuyên khoa thành công',
      data,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách chuyên khoa' })
  async findAll() {
    const data = await this.service.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách chuyên khoa thành công',
      data,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết chuyên khoa' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết chuyên khoa thành công',
      data,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cập nhật chuyên khoa' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateSpecialtyDto) {
    const data = await this.service.update(id, updateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật chuyên khoa thành công',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xóa chuyên khoa (ẩn chuyên khoa)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Xóa chuyên khoa thành công',
    };
  }
}
