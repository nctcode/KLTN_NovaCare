'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { paymentService } from '@/services/payment.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function PaymentReturnPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const [bookingCode, setBookingCode] = useState('');

  const appointmentId = searchParams.get('appointmentId');
  const vnpResponseCode = searchParams.get('vnp_ResponseCode');
  const simulateMethod = searchParams.get('method');   // momo | vietqr | card
  const simulateStatus = searchParams.get('status');   // success

  useEffect(() => {
    const verifyPayment = async () => {
      if (!appointmentId) {
        setStatus('failed');
        setMessage('Không tìm thấy thông tin thanh toán lịch khám');
        return;
      }
      try {
        const result = await paymentService.getPaymentStatus(appointmentId);
        if (result && (result.status === 'PAID' || result.paymentStatus === 'PAID')) {
          setStatus('success');
          setBookingCode(result.bookingCode || '');
          setMessage('Thanh toán thành công! Lịch khám của bạn đã được xác nhận.');
        } else {
          setStatus('failed');
          setMessage(result?.message || 'Thanh toán không thành công hoặc đang chờ xử lý.');
        }
      } catch {
        setStatus('failed');
        setMessage('Có lỗi xảy ra khi xác thực kết quả thanh toán với máy chủ.');
      }
    };

    // Simulated methods (MoMo, VietQR, Card)
    if (simulateMethod && simulateStatus === 'success') {
      verifyPayment();
      return;
    }

    // VNPay gateway
    if (vnpResponseCode === '00') {
      verifyPayment();
    } else if (vnpResponseCode) {
      setStatus('failed');
      setMessage('Thanh toán không thành công hoặc giao dịch bị hủy bỏ.');
    } else {
      // No params at all
      setStatus('failed');
      setMessage('Không tìm thấy thông tin giao dịch hợp lệ.');
    }
  }, [appointmentId, vnpResponseCode, simulateMethod, simulateStatus]);

  const methodLabel: Record<string, string> = {
    momo: 'Ví MoMo',
    vietqr: 'VietQR',
    card: 'Thẻ quốc tế',
    vnpay: 'VNPay',
  };
  const method = simulateMethod || 'vnpay';

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#4caf50] mx-auto" />
          <p className="text-gray-600 font-medium">Đang xác thực kết quả thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-xl rounded-3xl overflow-hidden">
        {/* Top banner */}
        <div className={`px-6 py-8 text-center ${status === 'success' ? 'bg-gradient-to-b from-green-50 to-white' : 'bg-gradient-to-b from-red-50 to-white'}`}>
          {status === 'success' ? (
            <div className="flex justify-center mb-3">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-11 w-11 text-[#4caf50]" />
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-3">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-11 w-11 text-red-500" />
              </div>
            </div>
          )}
          <CardTitle className="text-2xl text-secondary">
            {status === 'success' ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
          </CardTitle>
          {status === 'success' && (
            <p className="text-sm text-gray-500 mt-1">
              qua <strong>{methodLabel[method] || method}</strong>
            </p>
          )}
        </div>

        <CardContent className="px-6 pb-6 space-y-5">
          {status === 'success' && bookingCode && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-[#4caf50]" />
                <span>Mã phiếu khám</span>
              </div>
              <span className="font-bold font-mono text-[#4caf50] text-base">{bookingCode}</span>
            </div>
          )}

          <p className="text-center text-sm text-gray-600 leading-relaxed">{message}</p>

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full bg-[#4caf50] hover:bg-[#439e47] rounded-xl font-bold">
              <Link href="/lich-kham">
                {status === 'success' ? 'Xem lịch khám của tôi' : 'Thử thanh toán lại'}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full rounded-xl">
              <Link href="/">Quay về trang chủ</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#4caf50] mx-auto" />
            <p className="text-gray-600 font-medium">Đang xác thực kết quả thanh toán...</p>
          </div>
        </div>
      }
    >
      <PaymentReturnPageContent />
    </Suspense>
  );
}
