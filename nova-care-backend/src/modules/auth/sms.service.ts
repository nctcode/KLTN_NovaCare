import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  constructor(private readonly config: ConfigService) {}

  async sendResetOtp(phone: string, otp: string): Promise<void> {
    const ApiKey = this.config.get<string>('ESMS_API_KEY');
    const SecretKey = this.config.get<string>('ESMS_SECRET_KEY');
    const Brandname = this.config.get<string>('ESMS_BRANDNAME');
    const template = this.config.get<string>('ESMS_OTP_TEMPLATE');
    if (!ApiKey || !SecretKey || !Brandname || !template?.includes('{OTP}')) {
      throw new ServiceUnavailableException('Dịch vụ gửi SMS chưa được cấu hình. Vui lòng thử lại sau.');
    }
    const requestId = randomUUID();
    let failure = 'network_or_timeout';
    let httpStatus: number | undefined;
    let providerCode = 'unknown';
    try {
      const response = await fetch('https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({ ApiKey, SecretKey, Brandname, Phone: phone,
          Content: template.replaceAll('{OTP}', otp), SmsType: '2',
          IsUnicode: this.config.get<string>('ESMS_IS_UNICODE') || '0', RequestId: requestId }),
      });
      httpStatus = response.status;
      failure = response.ok ? 'invalid_response' : 'http_error';
      const result = await response.json();
      const code = String(result?.CodeResult ?? '');
      providerCode = /^\d{2,3}$/.test(code) ? code : 'unknown';
      if (!response.ok || code !== '100' || !result?.SMSID) {
        if (response.ok && providerCode !== 'unknown' && code !== '100') failure = 'provider_rejected';
        throw new Error('SMS rejected');
      }
    } catch {
      // Only bounded metadata: never log raw response/error, credentials, OTP or phone.
      this.logger.error({ event: 'sms_delivery_failed', requestId, failure, httpStatus, providerCode });
      throw new ServiceUnavailableException('Chưa thể gửi mã xác thực. Vui lòng thử lại sau.');
    }
  }
}
