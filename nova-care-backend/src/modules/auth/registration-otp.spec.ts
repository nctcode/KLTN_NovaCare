import { RegistrationOtpService, normalizePhone, tokenHash } from './registration-otp.service';
import * as argon2 from 'argon2';

describe('Registration OTP', () => {
  let challenge: any;
  let prisma: any;
  let sms: any;
  let service: RegistrationOtpService;
  beforeEach(() => {
    challenge = null;
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      registrationOtpChallenge: {
        findUnique: jest.fn(async () => challenge),
        upsert: jest.fn(async ({ create, update }: any) => { challenge = challenge ? { ...challenge, ...update } : create; }),
        update: jest.fn(async ({ data }: any) => { challenge = { ...challenge, ...data, attempts: data.attempts ? challenge.attempts + 1 : challenge.attempts }; }),
        updateMany: jest.fn(async () => { if (challenge) challenge.otpHash = null; }),
      },
      $transaction: (fn: any) => fn(prisma),
    };
    sms = { sendResetOtp: jest.fn() };
    service = new RegistrationOtpService(prisma, sms);
  });
  it('normalizes Vietnamese numbers', () => expect(normalizePhone('+84 912 345 678')).toBe('0912345678'));
  it('rejects a phone already registered', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(service.request('0912345678')).rejects.toThrow('đã được đăng ký');
    expect(sms.sendResetOtp).not.toHaveBeenCalled();
  });
  it('stores only OTP hash and returns no OTP', async () => {
    const response = await service.request('0912345678');
    const otp = sms.sendResetOtp.mock.calls[0][1];
    expect(response).not.toHaveProperty('otpCode');
    expect(await argon2.verify(challenge.otpHash, otp)).toBe(true);
  });
  it('requires a correct OTP before issuing a one-time token', async () => {
    await service.request('0912345678');
    await expect(service.verify('0912345678', '000000')).rejects.toThrow();
    const result = await service.verify('0912345678', sms.sendResetOtp.mock.calls[0][1]);
    expect(result.verificationToken).toHaveLength(64);
    expect(challenge.verificationTokenHash).toBe(tokenHash(result.verificationToken));
    expect(challenge.otpHash).toBeNull();
  });
  it('invalidates challenge if SMS delivery fails', async () => {
    sms.sendResetOtp.mockRejectedValue(new Error('provider'));
    await expect(service.request('0912345678')).rejects.toThrow();
    expect(challenge.otpHash).toBeNull();
  });
});
