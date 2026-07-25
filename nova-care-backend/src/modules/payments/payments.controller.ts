import { Controller, Post, Get, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { PaymentsService } from './payments.service';
import { Request } from 'express';

import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 'uuid-string', description: 'Mã lịch hẹn' })
  @IsNotEmpty({ message: 'Mã lịch hẹn không được để trống' })
  @IsString({ message: 'Mã lịch hẹn phải là chuỗi' })
  appointmentId: string;
}

export class SimulatePaymentDto {
  @ApiProperty({ example: 'uuid-string', description: 'Mã lịch hẹn' })
  @IsNotEmpty({ message: 'Mã lịch hẹn không được để trống' })
  @IsString({ message: 'Mã lịch hẹn phải là chuỗi' })
  appointmentId: string;

  @ApiProperty({ example: 'MOMO', description: 'Phương thức thanh toán (MOMO, VIETQR, CARD)' })
  paymentMethod?: string;
}

@ApiTags('Thanh toán')
@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tạo URL thanh toán VNPay' })
  async createPayment(@Body() dto: CreatePaymentDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const paymentUrl = await this.paymentsService.createPaymentUrl(dto.appointmentId, ip);
    return {
      statusCode: 200,
      message: 'Tạo link thanh toán VNPay thành công',
      data: { paymentUrl },
    };
  }

  @Post('simulate-success')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Giả lập thanh toán MoMo / VietQR / Thẻ thành công' })
  async simulateSuccess(@Body() dto: SimulatePaymentDto) {
    const result = await this.paymentsService.simulatePaymentSuccess(
      dto.appointmentId,
      dto.paymentMethod || 'MOMO'
    );
    return {
      statusCode: 200,
      message: 'Giả lập thanh toán thành công',
      data: result,
    };
  }

  @Public()
  @Get('vnpay-ipn')
  @ApiOperation({ summary: 'Tiếp nhận IPN (Instant Payment Notification) từ VNPay (GET)' })
  async handleIpnGet(@Query() query: Record<string, any>) {
    return this.paymentsService.handleIpn(query);
  }

  @Public()
  @Post('vnpay-ipn')
  @ApiOperation({ summary: 'Tiếp nhận IPN (Instant Payment Notification) từ VNPay (POST)' })
  async handleIpnPost(@Query() query: Record<string, any>, @Body() body: Record<string, any>) {
    const params = { ...query, ...body };
    return this.paymentsService.handleIpn(params);
  }

  @Get('status/:appointmentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Kiểm tra trạng thái thanh toán giao dịch' })
  async getStatus(@Param('appointmentId') appointmentId: string) {
    const result = await this.paymentsService.getPaymentStatus(appointmentId);
    return {
      statusCode: 200,
      message: 'Lấy trạng thái thanh toán thành công',
      data: result,
    };
  }
}
