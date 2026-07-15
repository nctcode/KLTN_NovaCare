import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Người dùng')
@ApiBearerAuth('access-token')
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Thông tin người dùng' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getProfile(@CurrentUser() user: User) {
    const { passwordHash: _, ...profile } = user;
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin người dùng thành công',
      data: profile,
    };
  }

  @Put('me')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 409, description: 'Email hoặc số điện thoại đã tồn tại' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto
  ) {
    const updatedUser = await this.usersService.update(user.id, updateUserDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật thông tin thành công',
      data: updatedUser,
    };
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa tài khoản (xóa mềm)' })
  @ApiResponse({ status: 204, description: 'Xóa tài khoản thành công' })
  async deleteAccount(@CurrentUser() user: User) {
    await this.usersService.softDelete(user.id);
  }
}
