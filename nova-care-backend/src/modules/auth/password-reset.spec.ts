import { PasswordResetService, resetIdentifier } from './password-reset.service';
import { SmsService } from './sms.service';
import * as argon2 from 'argon2';
import { JwtStrategy } from './strategies/jwt.strategy';

describe('Password recovery', () => {
  let challenge: any;
  let prisma: any;
  let sms: any;
  let email: any;
  let service: PasswordResetService;
  beforeEach(() => {
    challenge = null;
    prisma = {
      $queryRaw: jest.fn(),
      user: { findFirst: jest.fn().mockResolvedValue({ id: 'user', fullName: 'Patient' }), update: jest.fn() },
      passwordResetChallenge: {
        findUnique: jest.fn(async () => challenge),
        findFirst: jest.fn(async ({ where }: any) => challenge?.verificationTokenHash === where.verificationTokenHash ? challenge : null),
        upsert: jest.fn(async ({ create }: any) => { challenge = create; }),
        update: jest.fn(async ({ data }: any) => { challenge = { ...challenge, ...data, attempts: data.attempts ? challenge.attempts + 1 : challenge.attempts }; }),
        updateMany: jest.fn(async () => { challenge.otpHash = null; }),
      },
      refreshToken: { updateMany: jest.fn() },
      $transaction: (fn: any) => fn(prisma),
    };
    sms = { sendResetOtp: jest.fn() };
    email = { sendForgotPasswordOtp: jest.fn().mockResolvedValue(true) };
    service = new PasswordResetService(prisma, sms, email);
  });
  it('normalizes Vietnamese phone numbers and rejects ambiguous destinations', () => {
    expect(resetIdentifier({ phone: '+84 912 345 678' })).toEqual({ phone: '0912345678' });
    expect(() => resetIdentifier({ phone: '0912345678', email: 'a@b.com' })).toThrow();
    expect(() => resetIdentifier({ phone: '123' })).toThrow();
  });
  it('sends SMS without exposing OTP and stores only a hash', async () => {
    const result = await service.request({ phone: '0912345678' });
    const otp = sms.sendResetOtp.mock.calls[0][1];
    expect(result).not.toHaveProperty('otpCode');
    expect(challenge.otpHash).not.toBe(otp);
    expect(await argon2.verify(challenge.otpHash, otp)).toBe(true);
    expect(email.sendForgotPasswordOtp).not.toHaveBeenCalled();
  });
  it('does not reveal an unknown account', async () => {
    const known = await service.request({ phone: '0912345678' });
    prisma.user.findFirst.mockResolvedValue(null);
    expect(await service.request({ phone: '0912345678' })).toEqual(known);
  });
  it('enforces resend cooldown', async () => {
    await service.request({ phone: '0912345678' });
    await service.request({ phone: '0912345678' });
    expect(sms.sendResetOtp).toHaveBeenCalledTimes(1);
  });
  it('limits total sends in an hour', async () => {
    await service.request({ phone: '0912345678' });
    challenge.requestedAt = new Date(Date.now() - 61000);
    challenge.sendCount = 5;
    await service.request({ phone: '0912345678' });
    expect(sms.sendResetOtp).toHaveBeenCalledTimes(1);
  });
  it('replaces a previous OTP when resending', async () => {
    await service.request({ phone: '0912345678' });
    const previousHash = challenge.otpHash;
    challenge.requestedAt = new Date(Date.now() - 61000);
    await service.request({ phone: '0912345678' });
    expect(challenge.otpHash).not.toBe(previousHash);
    expect(challenge.sendCount).toBe(2);
  });
  it('invalidates a failed delivery', async () => {
    sms.sendResetOtp.mockRejectedValue(new Error('provider failure'));
    await expect(service.request({ phone: '0912345678' })).rejects.toThrow();
    expect(challenge.otpHash).toBeNull();
  });
  it('locks after five incorrect attempts', async () => {
    await service.request({ phone: '0912345678' });
    for (let i = 0; i < 5; i++) await expect(service.verify({ phone: '0912345678', otpCode: '000000' })).rejects.toThrow();
    const otp = sms.sendResetOtp.mock.calls[0][1];
    await expect(service.verify({ phone: '0912345678', otpCode: otp })).rejects.toThrow();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it('rejects expired codes', async () => {
    await service.request({ phone: '0912345678' });
    challenge.expiresAt = new Date(0);
    await expect(service.verify({ phone: '0912345678', otpCode: sms.sendResetOtp.mock.calls[0][1] })).rejects.toThrow();
  });
  it('consumes OTP once and revokes sessions', async () => {
    await service.request({ phone: '0912345678' });
    const verified = await service.verify({ phone: '0912345678', otpCode: sms.sendResetOtp.mock.calls[0][1] });
    const dto = { resetToken: verified.resetToken, newPassword: 'newPassword123' };
    await service.reset(dto);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    expect(prisma.user.update.mock.calls[0][0].data.authVersion).toEqual({ increment: 1 });
    await expect(service.reset(dto)).rejects.toThrow();
  });
  it('fails email recovery when SMTP fails', async () => {
    email.sendForgotPasswordOtp.mockResolvedValue(false);
    await expect(service.request({ email: 'a@example.com' })).rejects.toThrow();
    expect(sms.sendResetOtp).not.toHaveBeenCalled();
  });
});

describe('eSMS transport', () => {
  afterEach(() => jest.restoreAllMocks());
  const config: any = { get: (key: string) => ({ ESMS_API_KEY: 'test-key', ESMS_SECRET_KEY: 'test-secret', ESMS_BRANDNAME: 'NovaCare', ESMS_OTP_TEMPLATE: '{OTP} test' }[key]) };
  it('requires configuration before sending', async () => {
    const fetchMock = jest.spyOn(global, 'fetch');
    await expect(new SmsService({ get: () => undefined } as any).sendResetOtp('0912345678', '123456')).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('accepts provider acknowledgement', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ CodeResult: '100', SMSID: 'test' }) } as any);
    await expect(new SmsService(config).sendResetOtp('0912345678', '123456')).resolves.toBeUndefined();
  });
  it('uses the exact eSMS trial template and the requested recipient', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ CodeResult: '100', SMSID: 'test' }) } as any);
    const trialConfig: any = { get: (key: string) => key === 'ESMS_BRANDNAME' ? 'Baotrixemay' : key === 'ESMS_OTP_TEMPLATE' ? '{OTP} la ma xac minh dang ky Baotrixemay cua ban' : config.get(key) };
    await new SmsService(trialConfig).sendResetOtp('0912345678', '123456');
    const body = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(body).toMatchObject({ Phone: '0912345678', Brandname: 'Baotrixemay', Content: '123456 la ma xac minh dang ky Baotrixemay cua ban', SmsType: '2', IsUnicode: '0' });
    expect(body).not.toHaveProperty('CallbackUrl');
    expect(body.RequestId.length).toBeLessThanOrEqual(50);
  });
  it('rejects provider failures without echoing secrets', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ CodeResult: '103' }) } as any);
    await expect(new SmsService(config).sendResetOtp('0912345678', '123456')).rejects.toThrow('Chưa thể gửi');
  });
  it('handles network timeout without logging provider data', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('timeout'));
    await expect(new SmsService(config).sendResetOtp('0912345678', '123456')).rejects.toThrow('Chưa thể gửi');
  });
});

describe('Access tokens after password reset', () => {
  it('rejects a token from an older authVersion', async () => {
    const strategy = new JwtStrategy({ get: () => 'test-secret' } as any, { findById: async () => ({ isActive: true, authVersion: 1 }) } as any);
    await expect(strategy.validate({ sub: 'user', email: 'a@example.com' })).rejects.toThrow();
    await expect(strategy.validate({ sub: 'user', email: 'a@example.com', authVersion: 1 })).resolves.toBeDefined();
  });
});
