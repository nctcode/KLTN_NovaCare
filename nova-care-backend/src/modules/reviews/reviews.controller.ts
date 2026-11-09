import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReviewTargetType, Role, User } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { CreateReviewResponseDto } from './dto/create-review-response.dto';
import { CreateReviewReportDto } from './dto/create-review-report.dto';
import { QueryReviewDto } from './dto/query-review.dto';

@ApiTags('Đánh giá Bác sĩ & Bệnh viện')
@Controller('api/v1/reviews')
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Get('eligibility/:appointmentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Kiểm tra điều kiện đánh giá của lượt khám' })
  async getEligibility(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: User,
  ) {
    const data = await this.service.getEligibility(appointmentId, user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Kiểm tra điều kiện đánh giá thành công',
      data,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tạo đánh giá mới cho Bác sĩ hoặc Cơ sở y tế' })
  @ApiResponse({ status: 201, description: 'Gửi đánh giá thành công (chờ duyệt)' })
  @ApiResponse({ status: 400, description: 'Lượt khám chưa hoàn thành hoặc dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Lượt khám này đã được đánh giá đối tượng này rồi' })
  async createReview(
    @CurrentUser() user: User,
    @Body() createDto: CreateReviewDto,
  ) {
    const data = await this.service.createReview(user.id, createDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Gửi đánh giá thành công. Đánh giá của bạn đang được kiểm duyệt trước khi công khai.',
      data,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Chỉnh sửa đánh giá trong thời hạn 48 giờ' })
  async updateReview(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateDto: UpdateReviewDto,
  ) {
    const data = await this.service.updateReview(user.id, id, updateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật đánh giá thành công. Đánh giá đã được chuyển về trạng thái chờ duyệt.',
      data,
    };
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lấy lịch sử đánh giá của chính người dùng đăng nhập' })
  async getMyReviews(
    @CurrentUser() user: User,
    @Query() query: QueryReviewDto,
  ) {
    const data = await this.service.getMyReviews(user.id, query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách đánh giá của tôi thành công',
      data,
    };
  }

  @Public()
  @Get('public/doctor/:doctorId')
  @ApiOperation({ summary: 'Lấy danh sách đánh giá công khai (APPROVED) của Bác sĩ' })
  async getPublicDoctorReviews(
    @Param('doctorId') doctorId: string,
    @Query() query: QueryReviewDto,
  ) {
    const data = await this.service.getPublicDoctorReviews(doctorId, query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách đánh giá công khai của bác sĩ thành công',
      data,
    };
  }

  @Public()
  @Get('public/hospital/:hospitalId')
  @ApiOperation({ summary: 'Lấy danh sách đánh giá công khai (APPROVED) của Cơ sở y tế' })
  async getPublicHospitalReviews(
    @Param('hospitalId') hospitalId: string,
    @Query() query: QueryReviewDto,
  ) {
    const data = await this.service.getPublicHospitalReviews(hospitalId, query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách đánh giá công khai của cơ sở y tế thành công',
      data,
    };
  }

  @Public()
  @Get('public/stats')
  @ApiOperation({ summary: 'Lấy thống kê điểm số và phân bố sao công khai' })
  @ApiQuery({ name: 'targetType', enum: ReviewTargetType })
  @ApiQuery({ name: 'targetId', type: String })
  async getPublicStats(
    @Query('targetType') targetType: ReviewTargetType,
    @Query('targetId') targetId: string,
  ) {
    const data = await this.service.getPublicStats(targetType, targetId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy thống kê đánh giá thành công',
      data,
    };
  }

  @Post(':id/responses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR, Role.HOSPITAL_ADMIN, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Bác sĩ hoặc đại diện Bệnh viện gửi phản hồi cho đánh giá' })
  async createResponse(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() responseDto: CreateReviewResponseDto,
  ) {
    const data = await this.service.createOrUpdateResponse(user, id, responseDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Gửi phản hồi thành công',
      data,
    };
  }

  @Post(':id/report')
  @Public()
  @ApiOperation({ summary: 'Báo cáo vi phạm đối với một đánh giá' })
  async reportReview(
    @Param('id') id: string,
    @CurrentUser() user: User | undefined,
    @Body() reportDto: CreateReviewReportDto,
  ) {
    const data = await this.service.reportReview(user ? user.id : null, id, reportDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Gửi báo cáo vi phạm thành công. Đội ngũ NovaCare sẽ tiến hành kiểm tra.',
      data,
    };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.HOSPITAL_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Quản trị viên tra cứu danh sách đánh giá phục vụ kiểm duyệt' })
  async adminGetReviews(
    @CurrentUser() user: User,
    @Query() query: QueryReviewDto,
  ) {
    const hospitalFilter = user.role === Role.HOSPITAL_ADMIN ? user.hospitalId : null;
    const data = await this.service.adminGetReviews(query, hospitalFilter);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách đánh giá quản trị thành công',
      data,
    };
  }

  @Patch('admin/:id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Quản trị viên duyệt, từ chối hoặc ẩn đánh giá' })
  async moderateReview(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() moderateDto: ModerateReviewDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const data = await this.service.moderateReview(
      user.id,
      id,
      moderateDto,
      ipAddress,
      userAgent,
    );
    return {
      statusCode: HttpStatus.OK,
      message: `Xử lý kiểm duyệt thành công (Trạng thái: ${moderateDto.status})`,
      data,
    };
  }

  @Get('admin/reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Quản trị viên xem danh sách các báo cáo vi phạm' })
  async adminGetReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isResolved') isResolved?: boolean,
  ) {
    const data = await this.service.adminGetReports(page ? Number(page) : 1, limit ? Number(limit) : 10, isResolved !== undefined ? String(isResolved) === 'true' : undefined);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách báo cáo vi phạm thành công',
      data,
    };
  }

  @Patch('admin/reports/:reportId/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Quản trị viên đánh dấu đã xử lý báo cáo vi phạm' })
  async adminResolveReport(
    @Param('reportId') reportId: string,
    @CurrentUser() user: User,
  ) {
    const data = await this.service.adminResolveReport(user.id, reportId, true);
    return {
      statusCode: HttpStatus.OK,
      message: 'Đánh dấu giải quyết báo cáo thành công',
      data,
    };
  }
}
