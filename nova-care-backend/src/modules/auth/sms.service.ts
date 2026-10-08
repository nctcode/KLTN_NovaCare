import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class SmsService {
  constructor(private readonly config: ConfigService) {}

  async sendResetOtp(phone: string, otp: string): Promise<void> {
    const ApiKey = this.config.get<string>('ESMS_API_KEY');
    const SecretKey = this.config.get<string>('ESMS_SECRET_KEY');
    const Brandname = this.config.get<string>('ESMS_BRANDNAME');
    const template = this.config.get<string>('ESMS_OTP_TEMPLATE');
    if (!ApiKey || !SecretKey || !Brandname || !template?.includes('{OTP}')) {
      throw new ServiceUnavailableException('Dịch vụ gửi SMS chưa được cấu hình. Vui lòng thử lại sau.');
    }
    try {
      const response = await fetch('https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({ ApiKey, SecretKey, Brandname, Phone: phone,
          Content: template.replaceAll('{OTP}', otp), SmsType: '2',
          IsUnicode: this.config.get<string>('ESMS_IS_UNICODE') || '0', RequestId: randomUUID() }),
      });
      const result = await response.json();
      if (!response.ok || String(result.CodeResult) !== '100' || !result.SMSID) throw new Error('SMS rejected');
    } catch {
      // Never expose/log provider request, credentials, OTP or phone number.
      throw new ServiceUnavailableException('Chưa thể gửi mã xác thực. Vui lòng thử lại sau.');
    }
  }
}
