import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PatientProfilesService } from './patient-profiles.service';
import { CreatePatientProfileDto } from './dto/create-patient-profile.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Hồ sơ người đi khám')
@ApiBearerAuth('access-token')
@Controller('api/v1/patient-profiles')
@UseGuards(JwtAuthGuard)
export class PatientProfilesController {
  constructor(private readonly service: PatientProfilesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo hồ sơ người đi khám mới' })
  @ApiResponse({ status: 201, description: 'Tạo hồ sơ thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  async create(@CurrentUser() user: User, @Body() createDto: CreatePatientProfileDto) {
    const profile = await this.service.create(user.id, createDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo hồ sơ thành công',
      data: profile,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách hồ sơ của tôi' })
  @ApiResponse({ status: 200, description: 'Danh sách hồ sơ' })
  async findAll(@CurrentUser() user: User) {
    const profiles = await this.service.findAll(user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách hồ sơ thành công',
      data: profiles,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết hồ sơ' })
  @ApiParam({ name: 'id', description: 'ID hồ sơ' })
  @ApiResponse({ status: 200, description: 'Chi tiết hồ sơ' })
  @ApiResponse({ status: 404, description: 'Hồ sơ không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    const profile = await this.service.findOne(id, user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết hồ sơ thành công',
      data: profile,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật hồ sơ' })
  @ApiParam({ name: 'id', description: 'ID hồ sơ' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Hồ sơ không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateDto: UpdatePatientProfileDto
  ) {
    const profile = await this.service.update(id, user.id, updateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật hồ sơ thành công',
      data: profile,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hồ sơ (xóa mềm)' })
  @ApiParam({ name: 'id', description: 'ID hồ sơ' })
  @ApiResponse({ status: 200, description: 'Xóa hồ sơ thành công' })
  @ApiResponse({ status: 404, description: 'Hồ sơ không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.service.remove(id, user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Xóa hồ sơ thành công',
    };
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Đặt hồ sơ làm mặc định' })
  @ApiParam({ name: 'id', description: 'ID hồ sơ' })
  @ApiResponse({ status: 200, description: 'Đặt mặc định thành công' })
  @ApiResponse({ status: 404, description: 'Hồ sơ không tồn tại' })
  async setDefault(@Param('id') id: string, @CurrentUser() user: User) {
    const profile = await this.service.setDefault(id, user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Đặt hồ sơ mặc định thành công',
      data: profile,
    };
  }
}
