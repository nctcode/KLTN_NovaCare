import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from '@/modules/payments/payments.service';
import { PrismaService } from '@/database/prisma.service';
import { QueueService } from '@/queue/queue.service';
import * as crypto from 'crypto';

describe('PaymentsService Unit Tests', () => {
  let service: PaymentsService;
  let prismaService: any;
  let queueService: any;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'VNP_TMN_CODE':
          return '2QX5222E';
        case 'VNP_HASH_SECRET':
          return 'RA499R1M587FNHFOWD2W13W35N6L8XLS';
        case 'VNP_URL':
          return 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        case 'VNP_RETURN_URL':
          return 'http://localhost:3001/thanh-toan/return';
        default:
          return null;
      }
    }),
  };

  const createMockPrisma = (): any => {
    const mockObj: any = {
      appointment: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      paymentTransaction: {
        upsert: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      appointmentStatusHistory: {
        create: jest.fn(),
      },
    };
    mockObj['$transaction'] = jest.fn((callback: any) => callback(mockObj));
    return mockObj;
  };

  const mockPrismaService = createMockPrisma();

  const mockQueueService = {
    addEmailJob: jest.fn(),
    addPushJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: QueueService, useValue: mockQueueService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prismaService = module.get(PrismaService);
    queueService = module.get(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPaymentUrl', () => {
    it('should generate valid VNPay payment URL with SHA512 checksum', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: 'appt-123',
        bookingCode: 'NOVATEST01',
        totalPrice: 300000,
        status: 'AWAITING_PAYMENT',
        patientProfile: { fullName: 'Nguyen Van A' },
      });
      mockPrismaService.paymentTransaction.upsert.mockResolvedValue({});

      const url = await service.createPaymentUrl('appt-123', '127.0.0.1');

      expect(url).toContain('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
      expect(url).toContain('vnp_TmnCode=2QX5222E');
      expect(url).toContain('vnp_Amount=30000000');
      expect(url).toContain('vnp_SecureHash=');
    });
  });

  describe('handleIpn', () => {
    it('should return RspCode 97 for invalid checksum', async () => {
      const result = await service.handleIpn({
        vnp_TxnRef: 'NOVA123',
        vnp_ResponseCode: '00',
        vnp_SecureHash: 'invalid_hash_value',
      });

      expect(result.RspCode).toBe('97');
      expect(result.Message).toBe('Invalid Checksum');
    });

    it('should return RspCode 00 for valid checksum and process payment success', async () => {
      const secretKey = 'RA499R1M587FNHFOWD2W13W35N6L8XLS';
      const vnpParams: Record<string, string> = {
        vnp_Amount: '30000000',
        vnp_BankCode: 'NCB',
        vnp_Command: 'pay',
        vnp_CreateDate: '20260722100000',
        vnp_CurrCode: 'VND',
        vnp_IpAddr: '127.0.0.1',
        vnp_Locale: 'vn',
        vnp_OrderInfo: 'Thanh toan',
        vnp_ResponseCode: '00',
        vnp_TmnCode: '2QX5222E',
        vnp_TransactionNo: '145000',
        vnp_TxnRef: 'NOVA123',
        vnp_Version: '2.1.0',
      };

      const sortedKeys = Object.keys(vnpParams).sort();
      const signData = sortedKeys.map((key) => `${key}=${vnpParams[key]}`).join('&');
      const secureHash = crypto.createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');

      vnpParams['vnp_SecureHash'] = secureHash;

      mockPrismaService.paymentTransaction.findFirst.mockResolvedValue({
        id: 'tx-123',
        appointmentId: 'appt-123',
        status: 'PENDING',
        appointment: { id: 'appt-123', bookingCode: 'NOVATEST01' },
      });
      mockPrismaService.paymentTransaction.update.mockResolvedValue({});
      mockPrismaService.appointment.update.mockResolvedValue({});

      const result = await service.handleIpn(vnpParams);

      expect(result.RspCode).toBe('00');
      expect(result.Message).toBe('Confirm Success');
      expect(mockQueueService.addEmailJob).toHaveBeenCalledWith('appt-123', 'payment_success');
    });
  });
});
