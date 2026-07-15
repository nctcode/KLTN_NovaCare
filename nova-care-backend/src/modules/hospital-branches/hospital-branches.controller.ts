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
import { HospitalBranchesService } from './hospital-branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Chi nhánh cơ sở y tế')
@Controller('api/v1/hospital-branches')
export class HospitalBranchesController {
  constructor(private readonly service: HospitalBranchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tạo chi nhánh mới' })
  async create(@Body() createDto: CreateBranchDto) {
    const data = await this.service.create(createDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo chi nhánh thành công',
      data,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách chi nhánh' })
  async findAll() {
    const data = await this.service.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách chi nhánh thành công',
      data,
    };
  }

  @Public()
  @Get('hospital/:hospitalId')
  @ApiOperation({ summary: 'Lấy danh sách chi nhánh theo cơ sở' })
  async findByHospital(@Param('hospitalId') hospitalId: string) {
    const data = await this.service.findByHospital(hospitalId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách chi nhánh thành công',
      data,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết chi nhánh' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết chi nhánh thành công',
      data,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cập nhật chi nhánh' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateBranchDto) {
    const data = await this.service.update(id, updateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật chi nhánh thành công',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xóa chi nhánh (xóa mềm)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Xóa chi nhánh thành công',
    };
  }
}
