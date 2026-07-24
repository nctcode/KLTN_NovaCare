import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class EmailService {
  private logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = this.configService.get<number>('SMTP_PORT') || 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendMail(to: string, subject: string, html: string, appointmentId?: string, userId?: string, type: string = 'general'): Promise<boolean> {
    const from = this.configService.get<string>('SMTP_FROM') || 'novacare.health@gmail.com';
    try {
      if (this.configService.get<string>('SMTP_USER') && this.configService.get<string>('SMTP_PASS') !== 'novacare-demo-app-pass') {
        await this.transporter.sendMail({
          from: `"NovaCare" <${from}>`,
          to,
          subject,
          html,
        });
      } else {
        this.logger.log(`[Email Simulated - ${type}] To: ${to} | Subject: ${subject}`);
      }

      if (userId) {
        await this.prisma.notificationLog.create({
          data: {
            userId,
            appointmentId,
            type,
            channel: 'email',
            status: 'sent',
            sentAt: new Date(),
          },
        });
      }
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      if (userId) {
        await this.prisma.notificationLog.create({
          data: {
            userId,
            appointmentId,
            type,
            channel: 'email',
            status: 'failed',
            errorMessage: error.message,
          },
        });
      }
      return false;
    }
  }

  async sendAppointmentConfirmation(email: string, fullName: string, bookingCode: string, doctorName: string, hospitalName: string, dateStr: string, appointmentId: string, userId: string) {
    const subject = `[NovaCare] Xác nhận đặt lịch khám thành công - Mã: ${bookingCode}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
        <h2 style="color: #22C55E; text-align: center;">XÁC NHẬN ĐẶT LỊCH KHÁM - NOVACARE</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Yêu cầu đặt lịch khám của bạn đã được ghi nhận thành công trên hệ thống NovaCare.</p>
        <div style="background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p><strong>Mã phiếu khám:</strong> <span style="color: #1A2B3C; font-size: 18px; font-weight: bold;">${bookingCode}</span></p>
          <p><strong>Bác sĩ khám:</strong> ${doctorName}</p>
          <p><strong>Cơ sở y tế:</strong> ${hospitalName}</p>
          <p><strong>Thời gian khám:</strong> ${dateStr}</p>
        </div>
        <p>Vui lòng đến trước 15 phút và xuất trình mã phiếu khám tại quầy tiếp đón.</p>
        <p style="color: #666; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">Trân trọng,<br/>Đội ngũ Hỗ trợ NovaCare Health</p>
      </div>
    `;
    return this.sendMail(email, subject, html, appointmentId, userId, 'booking_confirmed');
  }

  async sendPaymentSuccess(email: string, fullName: string, bookingCode: string, amount: string, appointmentId: string, userId: string) {
    const subject = `[NovaCare] Thanh toán thành công - Mã phiếu khám: ${bookingCode}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
        <h2 style="color: #22C55E; text-align: center;">THANH TOÁN THÀNH CÔNG</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Giao dịch thanh toán phí khám cho phiếu khám <strong>${bookingCode}</strong> đã hoàn tất thành công.</p>
        <div style="background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p><strong>Mã phiếu khám:</strong> ${bookingCode}</p>
          <p><strong>Số tiền đã thanh toán:</strong> ${amount} VNĐ</p>
          <p><strong>Phương thức:</strong> VNPay Online</p>
          <p><strong>Trạng thái:</strong> Đã thanh toán (PAID)</p>
        </div>
        <p>Cảm ơn bạn đã lựa chọn dịch vụ NovaCare Health.</p>
      </div>
    `;
    return this.sendMail(email, subject, html, appointmentId, userId, 'payment_success');
  }

  async sendAppointmentReminder(email: string, fullName: string, bookingCode: string, doctorName: string, dateStr: string, appointmentId: string, userId: string) {
    const subject = `[NovaCare] Nhắc lịch khám sắp tới - Mã: ${bookingCode}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
        <h2 style="color: #1A2B3C; text-align: center;">NHẮC NHỞ LỊCH KHÁM Y TẾ</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>NovaCare xin nhắc bạn có lịch hẹn khám sắp tới với thông tin như sau:</p>
        <div style="background-color: #fff3cd; color: #856404; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p><strong>Mã phiếu:</strong> ${bookingCode}</p>
          <p><strong>Bác sĩ:</strong> ${doctorName}</p>
          <p><strong>Thời gian khám:</strong> ${dateStr}</p>
        </div>
        <p>Vui lòng chuẩn bị giấy tờ cá nhân và có mặt đúng giờ.</p>
      </div>
    `;
    return this.sendMail(email, subject, html, appointmentId, userId, 'reminder');
  }

  async sendForgotPasswordOtp(email: string, fullName: string, otpCode: string, userId: string) {
    const subject = `[NovaCare] Mã OTP xác nhận quên mật khẩu: ${otpCode}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
        <h2 style="color: #22C55E; text-align: center;">MÃ XÁC THỰC OTP - NOVACARE</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Mã OTP để xác thực đặt lại mật khẩu cho tài khoản của bạn là:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background-color: #e8f5e9; color: #2e7d32; padding: 12px 24px; border-radius: 8px; display: inline-block;">${otpCode}</span>
        </div>
        <p>Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
      </div>
    `;
    return this.sendMail(email, subject, html, undefined, userId, 'forgot_password_otp');
  }
}
